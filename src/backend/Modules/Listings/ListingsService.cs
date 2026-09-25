using System.Text.Json;
using Microsoft.Extensions.Logging;
using Modules.Identity.Verification;
using Modules.ListingQuestions.Repositories;
using Modules.Listings.Models;
using Modules.Listings.Models.Dto;
using Modules.Listings.Repositories;
using Modules.Listings.Risk;
using Modules.Listings.Scoring;
using Modules.SharedKernel;

namespace Modules.Listings;

public class ListingService : IListingService
{
    private readonly IListingRepository _listings;

    private readonly IListingImageRepository _images;
    private readonly ISellerVerificationQuery _verification;
    private readonly IListingPublishedListener _listener;
    private readonly IListingQuestionRepository _questions;
    private readonly IListingRiskScoreService _risk;
    private readonly IListingNotifier _notifier;
    private readonly IClipVisionClient _clip;
    private readonly ILogger<ListingService> _logger;
    private readonly IListingResubmissionListener _resubmissionListener;

    private static readonly HashSet<string> _sellerAllowedStatuses = new()
    {
        "live",
        "draft",
        "removed",
    }; // as in removed form the platform because you sold it outside it

    private static readonly HashSet<string> _listingFixableReasonCodes = new()
    {
        "price_anomaly",
        "duplicate_image",
        "image_mismatch",
    };

    private const double _imageMismatchThreshold = 0.15;
    private const double _imageStrongMismatchThreshold = 0.05;
    private const int _maxImagesToScore = 4;
    private const decimal _mismatchVisibilityCap = 50;
    private const decimal _mediumRiskScoreFloor = 40m;
    private const decimal _highRiskScoreFloor = 70m;
    private const int _maxResubmissions = 5;

    public ListingService(
        IListingRepository listings,
        IListingImageRepository images,
        ISellerVerificationQuery verification,
        IListingPublishedListener listener,
        IListingResubmissionListener resubmissionListener,
        ILogger<ListingService> logger,
        IListingQuestionRepository questions,
        IListingRiskScoreService risk,
        IListingNotifier notifier,
        IClipVisionClient clip
    )
    {
        _listings = listings;
        _images = images;
        _verification = verification;
        _listener = listener;
        _resubmissionListener = resubmissionListener;
        _logger = logger;
        _questions = questions;
        _risk = risk;
        _notifier = notifier;
        _clip = clip;
    }

    public async Task<ListingSummaryDto?> GetByIdAsync(Guid listingId)
    {
        var listing = await _listings.GetByIdAsync(listingId);
        if (listing == null)
            return null;

        var countsDict = await _questions.GetAnsweredQuestionCountsAsync(new[] { listingId });

        return MapToSummary(listing) with
        {
            AnsweredQuestionCount = countsDict.GetValueOrDefault(listingId, 0),
        };
    }

    public async Task<PagedResult<ListingSummaryDto>> ListAsync(ListFilterDto filter)
    {
        var (items, total) = await _listings.ListAsync(filter);

        var listingIds = items.Select(l => l.ListingId).ToList();
        var countsDict = await _questions.GetAnsweredQuestionCountsAsync(listingIds);

        var summaries = items
            .Select(l =>
                MapToSummary(l) with
                {
                    AnsweredQuestionCount = countsDict.GetValueOrDefault(l.ListingId, 0),
                }
            )
            .ToList();

        return new PagedResult<ListingSummaryDto>(summaries, total);
    }

    public static ListingSummaryDto MapToSummary(Listing l)
    {
        var isAdminRemoved =
            l.ListingStatus == "removed" && !string.IsNullOrEmpty(l.RejectionReason);

        var exposeRisk =
        l.ListingStatus is "live" or "under_review" or "removed";

        int? visibilityScore =
        l.ListingStatus == "live" ? l.VisibilityScore : null;

        return new(
            ListingId: l.ListingId,
            SellerId: l.SellerId,
            Title: l.Title,
            Description: l.Description,
            Price: l.Price,
            Condition: l.Condition,
            CourseId: l.CourseId,
            CategoryId: l.CategoryId,
            CategoryName: l.Category?.Name ?? string.Empty,
            Metadata: string.IsNullOrEmpty(l.Metadata)
                ? null
                : JsonDocument.Parse(l.Metadata).RootElement,
            BookDetails: l.BookDetails is null
                ? null
                : new BookDetailsDto
                {
                    Isbn = l.BookDetails.Isbn,
                    Author = l.BookDetails.Author,
                    Edition = l.BookDetails.Edition,
                },
            ListingStatus: l.ListingStatus,
            IsBundle: l.IsBundle ?? false,
            ViewCount: l.ViewCount ?? 0,
            CreatedAt: l.CreatedAt,
            UpdatedAt: l.UpdatedAt,
            Images: l.Images.OrderByDescending(i => i.IsPrimary)
                .Select(i => new ListingImageDto(
                    i.ImageId,
                    $"/api/listings/{l.ListingId}/images/{i.ImageId}",
                    i.IsPrimary
                ))
                .ToList(),
            Seller: l.Seller is null
                ? null
                : new SellerInfoDto(
                    l.Seller.SellerId,
                    l.Seller.FirstName,
                    l.Seller.LastName,
                    l.Seller.FullName,
                    l.Seller.University,
                    l.Seller.ActiveListingCount
                ),
            ListingGroupId: l.ListingGroupId,
            ResubmissionCount: l.ResubmissionCount,
            MaxResubmissions: isAdminRemoved ? _maxResubmissions : 0,
            RiskLevel: exposeRisk ? l.AiRiskLevel : null,
            VisibilityScore: visibilityScore

        );
    }

    public async Task<ListingSummaryDto> CreateListings(
        CreateListingDto dto,
        Guid callerId,
        CancellationToken ct = default
    )
    {
        var quantity = dto.Quantity ?? 1;
        if (quantity is < 1 or > 10)
        {
            throw new ArgumentException("invalid_quantity");
        }

        var category = await _listings.ResolveByNameAsync(dto.CategoryName.Trim(), ct);
        if (category == null)
        {
            throw new ArgumentException("invalid_category");
        }

        bool isBook = string.Equals(category.Name, "book", StringComparison.OrdinalIgnoreCase);

        if (!isBook && (dto.BookDetails is not null || dto.CourseId is not null))
        {
            throw new ArgumentException("book_fields_not_allowed");
        }

        string? metadataJ = null;
        if (dto.Metadata.HasValue && dto.Metadata.Value.ValueKind != JsonValueKind.Null)
        {
            if (dto.Metadata.Value.ValueKind != JsonValueKind.Object)
            {
                throw new ArgumentException("invalid_metadata");
            }
            metadataJ = JsonSerializer.Serialize(dto.Metadata.Value);
        }

        var requestedStatus = dto.ListingStatus;
        var isVerified = await _verification.IsVerifiedAsync(callerId, ct);
        var effectiveStatus =
            !isVerified ? "draft"
            : requestedStatus == "live" ? "screening"
            : requestedStatus;

        var groupId = quantity > 1 ? Guid.NewGuid() : (Guid?)null;

        var created = new List<Listing>(quantity);
        for (var i = 0; i < quantity; i++)
        {
            var newListing = new Listing
            {
                Title = dto.Title,
                Description = dto.Description,
                Price = dto.Price,
                CategoryId = category.CategoryId,
                Condition = dto.Condition,
                Metadata = metadataJ,
                SellerId = callerId,
                ListingStatus = effectiveStatus,
                ListingId = Guid.NewGuid(),
                CourseId = isBook ? dto.CourseId : null,
                IsBundle = dto.IsBundle,
                ListingGroupId = groupId,
                ViewCount = 0,
                Images = new List<ListingImage>(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            if (isBook && dto.BookDetails is not null)
            {
                newListing.BookDetails = new BookDetails
                {
                    ListingId = newListing.ListingId,
                    Author = dto.BookDetails.Author,
                    Isbn = dto.BookDetails.Isbn,
                    Edition = dto.BookDetails.Edition?.Trim(),
                };
            }

            if (newListing.ListingStatus == "live")
            {
                var risk = await _risk.ScoreAsync(newListing, ct);
                newListing.AiRiskScore = risk.Score;
                newListing.AiRiskLevel = risk.Level;
                newListing.VisibilityScore = risk.VisibilityScore;
                newListing.AiRiskReasons = risk.Reasons.ToList();

                if (risk.Level == "high")
                {
                    newListing.ListingStatus = "under_review";
                }
            }

            created.Add(newListing);
        }
        await _listings.AddRangeAsync(created);

        foreach (var newListing in created)
        {
            if (newListing.ListingStatus == "under_review")
            {
                await _notifier.ListingStatusChangedAsync(
                    newListing.SellerId,
                    newListing.ListingId,
                    "under_review",
                    newListing.AiRiskLevel ?? "low",
                    ct
                );
                await _notifier.ListingFlaggedForAdminAsync(newListing.ListingId, ct);
            }
        }
        foreach (var newListing in created.Where(l => l.ListingStatus == "live"))
        {
            try
            {
                var evnt = new ListingPublishedEvent
                {
                    ListingId = newListing.ListingId,
                    Title = newListing.Title,
                    Description = newListing.Description,
                    Price = newListing.Price,
                    CategoryId = newListing.CategoryId,
                    CourseId = newListing.CourseId,
                    SellerId = newListing.SellerId,
                };
                await _listener.OnListingPublishedEventAsync(evnt, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to fire listing published event for listing {ListingId}",
                    newListing.ListingId
                );
            }
        }

        return MapToSummary(created[0]);
    }

    private static bool IsRescoreEligible(IEnumerable<RiskReason>? reasons)
    {
        if (reasons is null || !reasons.Any())
        {
            return false;
        }
        return reasons.All(r => _listingFixableReasonCodes.Contains(r.Code));
    }

    public async Task<ResubmitListingResultDto> ResubmitListingAsync(
        Guid listingId,
        Guid callerId,
        CancellationToken ct = default
    )
    {
        await _listings.DuplicateImagesToGroupAsync(listingId, ct);

        var result = await ResubmitOneAsync(listingId, callerId, ct);

        var listing = await _listings.GetByIdTrackedAsync(listingId);

        if (listing?.ListingGroupId is Guid groupId)
        {
            var siblings = await _listings.GetByGroupIdAsync(groupId, includeRemoved: true, ct);
            var pending = siblings.Where(s =>
                s.ListingId != listingId
                && s.ListingStatus == "removed"
                && !string.IsNullOrEmpty(s.RejectionReason)
            );

            foreach (var s in pending)
            {
                try
                {
                    await ResubmitOneAsync(s.ListingId, callerId, ct);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Could not resubmit copy {ListingId}", s.ListingId);
                }
            }
        }
        return result;
    }

    private async Task<ResubmitListingResultDto> ResubmitOneAsync(
        Guid listingId,
        Guid callerId,
        CancellationToken ct = default
    )
    {
        var listing = await _listings.GetByIdTrackedAsync(listingId);
        if (listing is null)
        {
            throw new KeyNotFoundException("listing_not_found");
        }

        if (listing.SellerId != callerId)
        {
            throw new UnauthorizedAccessException("forbidden");
        }

        var isAdminRemoved =
            listing.ListingStatus == "removed" && !string.IsNullOrEmpty(listing.RejectionReason);
        if (!isAdminRemoved)
        {
            throw new InvalidOperationException("listing_not_removed");
        }

        if (listing.ResubmissionCount >= _maxResubmissions)
        {
            throw new InvalidOperationException("resubmission_limit_exceeded");
        }

        if (listing.Images.Count == 0)
        {
            throw new InvalidOperationException("images_required");
        }
        if (string.IsNullOrWhiteSpace(listing.Description))
        {
            throw new InvalidOperationException("description_required");
        }
        if (!await _verification.IsVerifiedAsync(listing.SellerId, ct))
        {
            throw new InvalidOperationException("seller_not_verified");
        }

        listing.ResubmissionCount += 1;
        listing.RejectionReason = null;

        var risk = await _risk.ScoreAsync(listing, ct);
        listing.AiRiskScore = risk.Score;
        listing.AiRiskLevel = risk.Level;
        listing.VisibilityScore = risk.VisibilityScore;

        var reasons = risk.Reasons.ToList();
        await ApplyImageMatchAsync(listing, reasons, ct);
        listing.AiRiskReasons = reasons;

        listing.ListingStatus = listing.RequiresManualReviewOnResubmit ? "under_review"
        : listing.AiRiskLevel == "high" ? "under_review" 
        : "live";
        listing.UpdatedAt = DateTime.UtcNow;

       if (listing.RequiresManualReviewOnResubmit)
       {
        await _resubmissionListener.OnListingResubmittedAsync(listing.ListingId, ct);
       }
       listing.RequiresManualReviewOnResubmit = false;
        await _listings.SaveAsync();

        await _notifier.ListingStatusChangedAsync(
            listing.SellerId,
            listing.ListingId,
            listing.ListingStatus,
            listing.AiRiskLevel ?? "low",
            ct
        );

        if (listing.ListingStatus == "under_review")
        {
            await _notifier.ListingFlaggedForAdminAsync(listing.ListingId, ct);
        }

        if (listing.ListingStatus == "live")
        {
            try
            {
                var evnt = new ListingPublishedEvent
                {
                    ListingId = listing.ListingId,
                    Title = listing.Title,
                    Description = listing.Description,
                    Price = listing.Price,
                    CategoryId = listing.CategoryId,
                    CourseId = listing.CourseId,
                    SellerId = listing.SellerId,
                };
                await _listener.OnListingPublishedEventAsync(evnt, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to fire listing published event for listing {ListingId}",
                    listing.ListingId
                );
            }
        }

        return new ResubmitListingResultDto(listing.ListingStatus, listing.ResubmissionCount);
    }

    public async Task<bool> UpdateListings(
        UpdateListingDto listings,
        Guid id,
        Guid callerId,
        CancellationToken ct = default
    )
    {
        var listingLookUp = await _listings.GetByIdTrackedAsync(id);
        if (listingLookUp == null)
            return false;

        var priceChanged = listingLookUp.Price != listings.Price;
        var categoryChanged =
            !string.IsNullOrWhiteSpace(listings.CategoryName)
            && !string.Equals(
                listingLookUp.Category?.Name,
                listings.CategoryName.Trim(),
                StringComparison.OrdinalIgnoreCase
            );

        if (listingLookUp.SellerId != callerId)
        {
            throw new UnauthorizedAccessException("forbidden");
        }
        //edits forbideen if the listing is reserved,sold,pending or rejected
        var allowedEditStatuses = new[]
        {
            "draft",
            "live",
            "low_visibility",
            "removed",
            "under_review",
        };
        if (
            !allowedEditStatuses.Contains(
                listingLookUp.ListingStatus,
                StringComparer.OrdinalIgnoreCase
            )
        )
        {
            throw new InvalidOperationException("listing_locked_for_edit");
        }

        bool isBook =
            listingLookUp.Category != null
            && string.Equals(
                listingLookUp.Category.Name,
                "book",
                StringComparison.OrdinalIgnoreCase
            );

        if (!isBook && listings.BookDetails is not null)
        {
            throw new ArgumentException("book_fields_not_allowed");
        }

        listingLookUp.Title = listings.Title;
        listingLookUp.Description = listings.Description;
        listingLookUp.Price = listings.Price;
        listingLookUp.Condition = listings.Condition;
        listingLookUp.UpdatedAt = DateTime.UtcNow;

        if (isBook && listings.BookDetails is not null && listingLookUp.BookDetails is not null)
        {
            listingLookUp.BookDetails.Isbn = listings.BookDetails.Isbn;
            listingLookUp.BookDetails.Author = listings.BookDetails.Author;
            listingLookUp.BookDetails.Edition = listings.BookDetails.Edition;
        }

        if (listings.Metadata.HasValue && listings.Metadata.Value.ValueKind != JsonValueKind.Null)
        {
            var metadata = listings.Metadata.Value;
            if (metadata.ValueKind != JsonValueKind.Object)
            {
                throw new ArgumentException("invalid_metadata");
            }
            listingLookUp.Metadata = JsonSerializer.Serialize(metadata);
        }
        await ApplyCategoryChangeAsync(listings, listingLookUp);

        if (listings.RemovedImageIds is { Count: > 0 })
        {
            foreach (var imageId in listings.RemovedImageIds)
            {
                await _images.DeleteAsync(imageId, ct);
            }
        }

        if (listingLookUp.ListingGroupId is Guid groupId)
        {
            var siblings = await _listings.GetByGroupIdAsync(groupId, includeRemoved: true, ct);
            var syncable = siblings.Where(s =>
                s.ListingId != listingLookUp.ListingId
                && s.ListingStatus is not ("reserved" or "sold")
            );

            foreach (var sibling in syncable)
            {
                var trackedSibling = await _listings.GetByIdTrackedAsync(sibling.ListingId);
                if (trackedSibling is null)
                    continue;

                ApplyCoreFields(trackedSibling, listings);
                if (
                    isBook
                    && listings.BookDetails is not null
                    && trackedSibling.BookDetails is not null
                )
                {
                    trackedSibling.BookDetails.Isbn = listings.BookDetails.Isbn;
                    trackedSibling.BookDetails.Author = listings.BookDetails.Author;
                    trackedSibling.BookDetails.Edition = listings.BookDetails.Edition;
                }

                if (
                    listings.Metadata.HasValue
                    && listings.Metadata.Value.ValueKind != JsonValueKind.Null
                )
                {
                    trackedSibling.Metadata = listingLookUp.Metadata;
                }

                if (categoryChanged)
                {
                    trackedSibling.CategoryId = listingLookUp.CategoryId;
                    trackedSibling.CourseId = listingLookUp.CourseId;
                }
            }
        }
        var flagged = false;
        if (
            (priceChanged || categoryChanged)
            && listingLookUp.ListingStatus is "live" or "low_visibility"
        )
        {
            flagged = await ScoreListingAsync(listingLookUp, ct);
        }
        await _listings.SaveAsync();

        if (flagged)
        {
            await NotifyFlaggedAsync(listingLookUp, ct);
        }

        if (listings.RemovedImageIds is { Count: > 0 })
        {
            await _listings.DuplicateImagesToGroupAsync(id, ct);
        }
        return true;
    }

    private static void ApplyCoreFields(Listing target, UpdateListingDto dto)
    {
        target.Title = dto.Title;
        target.Description = dto.Description;
        target.Price = dto.Price;
        target.Condition = dto.Condition;
        target.UpdatedAt = DateTime.UtcNow;
    }

    private async Task ApplyCategoryChangeAsync(UpdateListingDto listings, Listing listingLookUp)
    {
        if (string.IsNullOrWhiteSpace(listings.CategoryName))
        {
            return;
        }

        var category = await _listings.ResolveByNameAsync(listings.CategoryName.Trim());
        if (category == null)
        {
            throw new ArgumentException("invalid_category");
        }

        bool isBook = string.Equals(category.Name, "book", StringComparison.OrdinalIgnoreCase);
        if (!isBook && listings.BookDetails is not null)
        {
            throw new ArgumentException("book_fields_not_allowed");
        }

        listingLookUp.CourseId = isBook ? listings.CourseId : null;
        listingLookUp.CategoryId = category.CategoryId;
        //listingLookUp.Category = category;
    }

    public async Task<bool> DeleteListings(Guid id, Guid callerId)
    {
        var listing = await _listings.GetByIdAsync(id);
        if (listing == null)
            return false;

        if (listing.SellerId != callerId)
        {
            throw new UnauthorizedAccessException("forbidden");
        }

        await _listings.DeleteByIdAsync(id);
        return true;
    }

    public async Task<bool> IsOwnerAsync(Guid listingId, Guid callerId)
    {
        return await _listings.IsOwnerAsync(listingId, callerId);
    }

    public async Task<bool> UpdateStatusAsync(
        Guid listingId,
        Guid callerId,
        string newStatus,
        CancellationToken ct = default
    )
    {
        var ok = await UpdateOneStatusAsync(listingId, callerId, newStatus, ct);
        if (!ok || newStatus is not ("live" or "draft"))
            return ok;
        var listing = await _listings.GetByIdTrackedAsync(listingId);
        if (listing?.ListingGroupId is Guid groupId)
        {
            var siblings = await _listings.GetByGroupIdAsync(groupId, includeRemoved: false, ct);
            var pending = siblings
                .Where(s =>
                    s.ListingId != listingId
                    && (
                        newStatus == "live"
                            ? s.ListingStatus is "draft" or "screening"
                            : s.ListingStatus == "screening"
                    )
                )
                .ToList();

            foreach (var s in pending)
            {
                try
                {
                    await UpdateOneStatusAsync(s.ListingId, callerId, newStatus, ct);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Could not update copy {ListingId}", s.ListingId);
                }
            }
        }
        return true;
    }

    private async Task<bool> UpdateOneStatusAsync(
        Guid listingId,
        Guid callerId,
        string newStatus,
        CancellationToken ct = default
    )
    {
        if (!_sellerAllowedStatuses.Contains(newStatus))
        {
            throw new ArgumentException("invalid_status");
        }

        var listing = await _listings.GetByIdTrackedAsync(listingId);
        if (listing is null)
        {
            return false;
        }

        if (listing.SellerId != callerId)
        {
            throw new UnauthorizedAccessException("forbidden");
        }
        if (
            listing.ListingStatus
            is "reserved"
                or "sold"
                or "pending"
                or "rejected"
                or "under_review"
        )
        {
            throw new InvalidOperationException("status_locked");
        }
        if (newStatus == "live" && listing.Images.Count == 0)
        {
            throw new InvalidOperationException("images_required");
        }
        if (newStatus == "live" && string.IsNullOrWhiteSpace(listing.Description))
        {
            throw new InvalidOperationException("description_required");
        }
        if (newStatus == "live" && !await _verification.IsVerifiedAsync(listing.SellerId, ct))
        {
            throw new InvalidOperationException("seller_not_verified");
        }

        if (newStatus == "live")
        {
            var risk = await _risk.ScoreAsync(listing, ct);
            listing.AiRiskScore = risk.Score;
            listing.AiRiskLevel = risk.Level;
            listing.VisibilityScore = risk.VisibilityScore;

            var reasons = risk.Reasons.ToList();
            await ApplyImageMatchAsync(listing, reasons, ct);
            listing.AiRiskReasons = reasons;

            listing.ListingStatus = listing.AiRiskLevel == "high" ? "under_review" : newStatus;
        }
        else
        {
            listing.ListingStatus = newStatus;
        }
        listing.UpdatedAt = DateTime.UtcNow;
        await _listings.SaveAsync();
        await _notifier.ListingStatusChangedAsync(
            listing.SellerId,
            listing.ListingId,
            listing.ListingStatus,
            listing.AiRiskLevel ?? "low",
            ct
        );
        if (listing.ListingStatus == "under_review")
        {
            await _notifier.ListingFlaggedForAdminAsync(listing.ListingId, ct);
        }
        if (listing.ListingStatus == "live")
        {
            try
            {
                var evnt = new ListingPublishedEvent
                {
                    ListingId = listing.ListingId,
                    Title = listing.Title,
                    Description = listing.Description,
                    Price = listing.Price,
                    CategoryId = listing.CategoryId,
                    CourseId = listing.CourseId,
                    SellerId = listing.SellerId,
                };
                await _listener.OnListingPublishedEventAsync(evnt, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to fire listing published event for listing {ListingId}",
                    listing.ListingId
                );
                //log later @Zelamene
            }
        }

        return true;
    }

    public async Task<SellerListingStatusDto?> GetStatusAsync(Guid listingId, Guid callerId)
    {
        var listing = await _listings.GetByIdAnyStatusAsync(listingId);
        if (listing is null)
        {
            return null;
        }
        if (listing.SellerId != callerId)
        {
            throw new UnauthorizedAccessException("forbidden");
        }

        var isBanned = listing.ListingStatus == "banned";
        var (status, message) = MapStatusAndMessage(listing);
        var isAdminRemoved =
            listing.ListingStatus == "removed" && !string.IsNullOrEmpty(listing.RejectionReason);
        var isLiveButFlagged =
            listing.ListingStatus == "live" && listing.AiRiskLevel == "medium";

        IReadOnlyList<ListingReasonDto>? reasons = null;
        if (listing.ListingStatus == "under_review"  || isAdminRemoved || isBanned || isLiveButFlagged || listing.ListingStatus == "banned")
        {
            reasons = listing
                .AiRiskReasons?.Select(r => new ListingReasonDto(r.Code, r.Detail, r.ImageId))
                .ToList();

            if ((reasons is null || reasons.Count == 0) && !string.IsNullOrEmpty(listing.RejectionReason))
            {
                reasons = new List<ListingReasonDto> { new("reported", listing.RejectionReason, null)};
            }
        }
        var canRescore =
            isLiveButFlagged && IsRescoreEligible(listing.AiRiskReasons);
        return new SellerListingStatusDto(
            listing.ListingId,
            status,
            listing.AiRiskLevel ?? "low",
            message,
            listing.VisibilityScore,
            listing.ResubmissionCount,
            isAdminRemoved ? _maxResubmissions : 0,
            reasons,
            canRescore
        );
    }

    private static (string Status, string Message) MapStatusAndMessage(Listing listing)
    {
        if (listing.ListingStatus == "live" && listing.AiRiskLevel == "medium")
        {
            return (
                "live",
                "Your listing is live but showing lower in search results due to some flagged concerns.Please edit your listing to fix the problem or re-check if not satifsied."
            );
        }

        return listing.ListingStatus switch
        {
            "live" => ("live", "Your listing is live."),
            "screening" => ("screening", "Your listing is being checked."),
            "under_review" => ("under_review", 
              string.IsNullOrEmpty(listing.RejectionReason)
            ? "Your listing is being reviewed by an admin."
            : $"Your listing reported and is being reviewed."),
            "removed" => (
                "removed",
                $"Your listing was removed."
            ),
            "banned" => ("banned", $"Your listing was permanently removed and cannot be resubmitted. Reason: {listing.RejectionReason ?? "Not specified"}."),
            _ => (listing.ListingStatus, $"Your listing is currently '{listing.ListingStatus}'."),
        };
    }

    public async Task<bool> RequestRescoreAsync(
        Guid listingId,
        Guid callerId,
        CancellationToken ct = default
    )
    {
        var listing = await _listings.GetByIdTrackedAsync(listingId);
        if (listing is null)
        {
            throw new KeyNotFoundException("listing_not_found");
        }
        if (listing.SellerId != callerId)
        {
            throw new UnauthorizedAccessException("forbidden");
        }
        if (listing.ListingStatus != "live" && listing.AiRiskLevel != "medium")
        {
            throw new InvalidOperationException("not_eligible_for_rescore");
        }
        if (!IsRescoreEligible(listing.AiRiskReasons))
        {
            throw new InvalidOperationException("rescore_not_eligible");
        }

        var wasFlagged = await ScoreListingAsync(listing, ct);
        listing.UpdatedAt = DateTime.UtcNow;
        await _listings.SaveAsync();

        if (wasFlagged)
        {
            await NotifyFlaggedAsync(listing, ct);
        }

        return listing.AiRiskLevel == "low";
    }

    public Task DuplicateImagesToGroupAsync(Guid sourceListingId, CancellationToken ct = default) =>
        _listings.DuplicateImagesToGroupAsync(sourceListingId, ct);

    private async Task<bool> ScoreListingAsync(Listing listing, CancellationToken ct)
    {
        var risk = await _risk.ScoreAsync(listing, ct);
        listing.AiRiskScore = risk.Score;
        listing.AiRiskLevel = risk.Level;
        listing.VisibilityScore = risk.VisibilityScore;

        var reasons = risk.Reasons.ToList();
        await ApplyImageMatchAsync(listing, reasons, ct);
        listing.AiRiskReasons = reasons;

        if (listing.AiRiskLevel == "high")
        {
            listing.ListingStatus = "under_review";
        }
        return listing.ListingStatus == "under_review";
    }

    private async Task NotifyFlaggedAsync(Listing listing, CancellationToken ct)
    {
        await _notifier.ListingStatusChangedAsync(
            listing.SellerId,
            listing.ListingId,
            "under_review",
            listing.AiRiskLevel ?? "low",
            ct
        );
        await _notifier.ListingFlaggedForAdminAsync(listing.ListingId, ct);
    }

    public async Task RescoreAfterImagesAsync(Guid listingId, CancellationToken ct = default)
    {
        var listing = await _listings.GetByIdTrackedAsync(listingId);
        if (listing is null)
            return;

        if (listing.ListingStatus is not ("live" or "low_visibility"))
            return;

        var flagged = await ScoreListingAsync(listing, ct);
        listing.UpdatedAt = DateTime.UtcNow;
        await _listings.SaveAsync();

        if (flagged)
        {
            await NotifyFlaggedAsync(listing, ct);
        }
    }

    public async Task RescoreGroupAfterImagesAsync(Guid listingId, CancellationToken ct = default)
    {
        var listing = await _listings.GetByIdTrackedAsync(listingId);
        if (listing is null)
            return;

        if (listing.ListingGroupId is Guid groupId)
        {
            var siblings = await _listings.GetByGroupIdAsync(groupId, includeRemoved: false, ct);
            foreach (var sibling in siblings)
            {
                await RescoreAfterImagesAsync(sibling.ListingId, ct);
            }
        }
        else
        {
            await RescoreAfterImagesAsync(listingId, ct);
        }
    }

    private async Task ApplyImageMatchAsync(
        Listing listing,
        List<RiskReason> reasons,
        CancellationToken ct
    )
    {
        var category = listing.Category?.Name;
        if (category is null)
        {
            _logger.LogWarning(
                "Category not loaded for listing {ListingId}; image check skipped",
                listing.ListingId
            );
            return;
        }

        if (string.Equals(category, "other", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var candidates = listing
            .Images.Where(i => i.ImageData is { Length: > 0 })
            .OrderByDescending(i => i.IsPrimary)
            .ThenBy(i => i.ImageId)
            .Take(_maxImagesToScore)
            .ToList();

        if (candidates.Count == 0)
            return;

        ListingImage? worstImage = null;
        ClipScoreResult? worst = null;

        foreach (var image in candidates)
        {
            var result = await _clip.ScoreAsync(image.ImageData!, category, ct);
            if (result is null)
                continue;

            if (worst is null || result.MatchScore < worst.MatchScore)
            {
                worst = result;
                worstImage = image;
            }
        }

        if (worst is null || worstImage is null)
        {
            _logger.LogWarning(
                "No CLIP score for listing {ListingId}; image check skipped",
                listing.ListingId
            );
            return;
        }

        var s = worst.MatchScore;
        listing.ImageMatchScore = s;

        if (s >= _imageMismatchThreshold)
            return;

        var detail = worst.TopLabel is null
            ? $"Photo doesn't match the claimed category '{category}' (match {s:P0})"
            : $"Photo looks like {worst.TopLabel} ({worst.TopLabelScore:P0}), "
                + $"not the claimed category '{category}' (match {s:P0})";

        reasons.Add(
            new RiskReason
            {
                Code = "image_mismatch",
                Detail = detail,
                ImageId = worstImage.ImageId,
            }
        );

        if (s < _imageStrongMismatchThreshold)
        {
            EscalateToHigh(listing, s);
        }
        else if (listing.AiRiskLevel == "low")
        {
            listing.AiRiskLevel = "medium";
            listing.AiRiskScore = Math.Max(listing.AiRiskScore ?? 0m, _mediumRiskScoreFloor);
            listing.VisibilityScore = (int)
                Math.Min(listing.VisibilityScore ?? 100, _mismatchVisibilityCap);
        }
        else if (listing.AiRiskLevel == "medium")
        {
            EscalateToHigh(listing, s);
        }
    }

    private static void EscalateToHigh(Listing listing, double matchScore)
    {
        var severity = (decimal)Math.Clamp(1 - matchScore / _imageStrongMismatchThreshold, 0, 1);
        var baseScore = Math.Max(listing.AiRiskScore ?? 0m, _highRiskScoreFloor);

        listing.AiRiskLevel = "high";
        listing.AiRiskScore = Math.Min(100m, baseScore + 30m * severity);
        listing.VisibilityScore = null;
    }
}
