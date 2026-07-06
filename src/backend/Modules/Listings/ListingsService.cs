using System.Text.Json;
using Modules.Listings.Models;
using Modules.Listings.Models.Dto;
using Modules.Listings.Repositories;
using Modules.SharedKernel;

namespace Modules.Listings;

public class ListingService : IListingService
{
    private readonly IListingRepository _listings;

    private readonly IListingImageRepository _images;

    public ListingService(IListingRepository listings, IListingImageRepository images)
    {
        _listings = listings;
        _images = images;
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
            IsBundle: l.isBundle ?? false,
            ViewCount: l.ViewCount ?? 0,
            CreatedAt: l.CreatedAt,
            UpdatedAt: l.UpdatedAt,
            Images: l.Images.OrderByDescending(i => i.IsPrimary)
                .Select(i => new ListingImageDto(
                    i.ImageId,
                    $"/api/listings/{l.ListingId}/images/{i.ImageId}",
                    i.IsPrimary
                ))
                .ToList()
        );

    public async Task<ListingSummaryDto> CreateListings(CreateListingDto dto, Guid callerId)
    {
        //resolve category
        var category = await _listings.ResolveByNameAsync(dto.CategoryName.Trim());
        if (category == null)
        {
            throw new ArgumentException("invalid_category");
        }

        bool isBook = string.Equals(category.Name, "book", StringComparison.OrdinalIgnoreCase);

        if (!isBook && (dto.BookDetails is not null || dto.CourseId is not null))
        {
            throw new ArgumentException("book_fields_not_allowed");
        }

        //validate metadata
        string? metadataJ = null;
        if (dto.Metadata.HasValue && dto.Metadata.Value.ValueKind != JsonValueKind.Null)
        {
            if (dto.Metadata.Value.ValueKind != JsonValueKind.Object)
            {
                throw new ArgumentException("invalid_metadata");
            }
            metadataJ = JsonSerializer.Serialize(dto.Metadata.Value);
        }

        var newListing = new Listing
        {
            Title = dto.Title,
            Description = dto.Description,
            Price = dto.Price,
            CategoryId = category.CategoryId,
            Condition = dto.Condition,
            Metadata = metadataJ,
            SellerId = callerId,
            ListingStatus = "live",
            ListingId = Guid.NewGuid(),
            CourseId = isBook ? dto.CourseId : null, // the course is only relevant for books only
            isBundle = dto.IsBundle,
            ViewCount = 0,
            Images = new List<ListingImage>(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        if (isBook && dto.BookDetails is not null)
        {
            //ValidateBookDetails()
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
        return MapToSummary(newListing);
    }

    //!!!!!validations for the book details!!!!

    public async Task<bool> UpdateListings(
        UpdateListingDto listings,
        Guid id,
        Guid callerId,
        CancellationToken ct = default
    )
    {
        // updates to text based fields
        var listingLookUp = await _listings.GetByIdTrackedAsync(id);
        if (listingLookUp == null)
            return false;

        if (listingLookUp.SellerId != callerId)
        {
            throw new UnauthorizedAccessException("forbidden");
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
        //update metadata
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
        // updates to images

        if (listings.RemovedImageIds is { Count: > 0 })
        {
            foreach (var imageId in listings.RemovedImageIds)
            {
                await _images.DeleteAsync(imageId, ct);
            }
        }

        return true;
    }

    private async Task ApplyCategoryChangeAsync(UpdateListingDto listings, Listing listingLookUp)
{
    if (string.IsNullOrWhiteSpace(listings.CategoryName))
    {
        return; // no category change requested
    }

    var category = await _listings.ResolveByNameAsync(listings.CategoryName!.Trim());
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
}
