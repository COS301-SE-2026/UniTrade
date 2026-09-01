using System.Text.Json;
using Modules.Identity.Verification;
using Modules.Listings.Models;
using Modules.Listings.Models.Dto;
using Modules.Listings.Repositories;
using Modules.SharedKernel;

namespace Modules.Listings;

public class ListingService : IListingService
{
    private readonly IListingRepository _listings;

    private readonly IListingImageRepository _images;
    private readonly ISellerVerificationQuery _verification;
    private readonly IListingPublishedListener _listener;

    private static readonly HashSet<string> _sellerAllowedStatuses = new()
    {
        "live",
        "draft",
        "removed",
    }; // as in removed form the platform because you sold it outside it

    public ListingService(
        IListingRepository listings,
        IListingImageRepository images,
        ISellerVerificationQuery verification
        //IListingPublishedListener listener
    )
    {
        _listings = listings;
        _images = images;
        _verification = verification;
        //_listener = listener;
    }

    public async Task<ListingSummaryDto?> GetByIdAsync(Guid listingId)
    {
        var listing = await _listings.GetByIdAsync(listingId);
        return listing == null ? null : MapToSummary(listing);
    }

    public async Task<PagedResult<ListingSummaryDto>> ListAsync(ListFilterDto filter)
    {
        var (items, total) = await _listings.ListAsync(filter);
        return new PagedResult<ListingSummaryDto>(items.Select(MapToSummary).ToList(), total);
    }

    private ListingSummaryDto MapToSummary(Listing l) =>
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
                )
        );

    public async Task<ListingSummaryDto> CreateListings(
        CreateListingDto dto,
        Guid callerId,
        CancellationToken ct = default
    )
    {
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
            ViewCount = 0,
            Images = new List<ListingImage>(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        if (isBook && dto.BookDetails is not null)
        {
            var newBook = new BookDetails
            {
                ListingId = newListing.ListingId,
                Author = dto.BookDetails.Author,
                Isbn = dto.BookDetails.Isbn,
                Edition = dto.BookDetails.Edition?.Trim(),
            };

            newListing.BookDetails = newBook;
        }
        await _listings.AddAsync(newListing);
        if (newListing.ListingStatus == "live")
        {
            try
            {
                var evnt = new ListingPublishedEvent
                {
                    ListingId = newListing.ListingId,
                    Title = newListing.Title,
                    Description = newListing.Description,
                    Price = newListing.Price,
                    CourseId = newListing.CourseId,
                    SellerId = newListing.SellerId,
                };
                await _listener.OnListingPublishedEventAsync(evnt, ct);
            }
            catch (Exception)
            {
                //log later @Zelamene
            }
        }
        return MapToSummary(newListing);
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
        if (listing.ListingStatus is "reserved" or "sold" or "pending" or "rejected")
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
        listing.ListingStatus = newStatus;
        listing.UpdatedAt = DateTime.Now;
        await _listings.SaveAsync();
        listing.ListingStatus = newStatus;
        listing.UpdatedAt = DateTime.UtcNow;
        if (newStatus == "live")
        {
            try
            {
                var evnt = new ListingPublishedEvent
                {
                    ListingId = listing.ListingId,
                    Title = listing.Title,
                    Description = listing.Description,
                    Price = listing.Price,
                    CourseId = listing.CourseId,
                    SellerId = listing.SellerId,
                };
                await _listener.OnListingPublishedEventAsync(evnt, ct);
            }
            catch (Exception)
            {
                //log later @Zelamene
            }
        }

        return true;
    }
}
