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
    private static readonly HashSet<string> _sellerAllowedStatuses = new()
    {
        "live",
        "draft",
        "removed",
    }; // as in removed form the platform because you sold it outside it

    private const double _imageMismatchThreshold = 0.15;
    private const int _minMediumVisibilityScore = 20;

    public ListingService(
        IListingRepository listings,
        IListingImageRepository images,
        ISellerVerificationQuery verification,
        IListingPublishedListener listener,
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

    public static ListingSummaryDto MapToSummary(Listing l) =>
        new(
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
            ListingGroupId: l.ListingGroupId
        );

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
        var effectiveStatus = isVerified ? requestedStatus : "draft";
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

        if (listingLookUp.SellerId != callerId)
        {
            throw new UnauthorizedAccessException("forbidden");
        }
        //edits forbideen if the listing is reserved,sold,pending or rejected
        var allowedEditStatuses = new[] { "draft", "live", "low_visibility" };
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

        await _listings.SaveAsync();
        return true;
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

        var (status, message) = MapStatusAndMessage(listing);
        return new SellerListingStatusDto(
            listing.ListingId,
            status,
            listing.AiRiskLevel ?? "low",
            message
        );
    }

    private static (string Status, string Message) MapStatusAndMessage(Listing listing)
    {
        return listing.ListingStatus switch
        {
            "live" => ("live", "Your listing is live."),
            "under_review" => ("under_review", "Your listing is being reviewed by an admin."),
            "removed" => (
                "removed",
                $"Your listing was removed. Reason: {listing.RejectionReason ?? "Not specified"}."
            ),
            "low_visibility" => ("live", "Your listing is live."),
            _ => (listing.ListingStatus, $"Your listing is currently '{listing.ListingStatus}'."),
        };
    }

    public Task DuplicateImagesToGroupAsync(Guid sourceListingId, CancellationToken ct = default) =>
        _listings.DuplicateImagesToGroupAsync(sourceListingId, ct);

    public async Task RescoreAfterImagesAsync(Guid listingId, CancellationToken ct = default)
    {
        var listing = await _listings.GetByIdTrackedAsync(listingId);
        if (listing is null)
            return;

        if (listing.ListingStatus is not ("live" or "low_visibility"))
            return;

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
        listing.UpdatedAt = DateTime.UtcNow;
        await _listings.SaveAsync();

        if (listing.ListingStatus == "under_review")
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
    }

    public async Task RescoreGroupAfterImagesAsync(Guid listingId, CancellationToken ct = default)
    {
        var listing = await _listings.GetByIdTrackedAsync(listingId);
        if (listing is null)
            return;

        if (listing.ListingGroupId is Guid groupId)
        {
            var siblings = await _listings.GetByGroupIdAsync(groupId, ct);
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
        var primary =
            listing.Images.FirstOrDefault(i => i.IsPrimary) ?? listing.Images.FirstOrDefault();
        if (primary is null || primary.ImageData.Length == 0)
        {
            return;
        }
        var category = listing.Category?.Name;
        var label = category ?? "item";
        listing.ImageMatchScore = await _clip.ScoreAsync(primary.ImageData, label, ct);

        var isScorable = !string.Equals(category, "other", StringComparison.OrdinalIgnoreCase);
        if (listing.ImageMatchScore is double s && isScorable && s < _imageMismatchThreshold)
        {
            reasons.Add(
                new RiskReason
                {
                    Code = "image_mismatch",
                    Detail =
                        $"Photo doesn't match the claimed category '{category}' (match {s:P0})",
                }
            );

            if (listing.AiRiskLevel == "low")
            {
                listing.AiRiskLevel = "medium";
                listing.VisibilityScore = Math.Max(
                    _minMediumVisibilityScore,
                    listing.VisibilityScore ?? _minMediumVisibilityScore
                );
            }
            else if (listing.AiRiskLevel == "medium")
            {
                listing.AiRiskLevel = "high";
            }
        }
    }
}
