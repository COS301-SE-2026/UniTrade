using Modules.Listings.Repositories;
using Modules.Listings.Models.Dto;
using Modules.Listings.Models;
using Modules.SharedKernel;

namespace Modules.Listings;

public class ListingService : IListingService
{
    private readonly IListingRepository _listings;

    public ListingService(IListingRepository listings)
    {
        _listings = listings;
    }

    public async Task<ListingSummaryDto?> GetByIdAsync(Guid listingId)
    {
        var listing = await _listings.GetByIdAsync(listingId);
        return listing == null ? null : MapToSummary(listing);
    }

    public async Task<PagedResult<ListingSummaryDto>> ListAsync(ListFilterDto filter)
    {
        var (items, total) = await _listings.ListAsync(filter);
        return new PagedResult<ListingSummaryDto>(
            items.Select(MapToSummary).ToList(),
            total);
    }

    private ListingSummaryDto MapToSummary(Listing l) => new(
        l.ListingId, l.SellerId,
        l.Title, l.Description, l.Price, l.Condition, l.ListingType,
        l.CourseId, l.Isbn, l.Author, l.Edition, l.ListingStatus,
        l.isBundle ?? false, l.ViewCount ?? 0,
        l.CreatedAt, l.UpdatedAt,
        l.Images
            .OrderByDescending(i => i.IsPrimary)
            .Select(i => new ListingImageDto(i.ImageId, $"/api/listings/{l.ListingId}/images/{i.ImageId}", i.IsPrimary))
            .ToList());

    public async Task<ListingSummaryDto> CreateListings(CreateListingDto dto)
    {
        var newListing = new Listing
        {
            Title = dto.Title,
            Description = dto.Description,
            Price = dto.Price,
            Condition = dto.Condition,
            ListingType = dto.ListingType,
            Author = dto.Author,
            Isbn = dto.Isbn,
            Edition = dto.Edition,
            SellerId = dto.SellerId,
            ListingStatus = dto.ListingStatus,
            ListingId = Guid.NewGuid(),
            CourseId = dto.CourseId,
            isBundle = dto.IsBundle,
            ViewCount = 0,
            Images = new List<ListingImage>(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        await _listings.AddAsync(newListing);
        return MapToSummary(newListing);
    }

    public async Task<bool> UpdateListings(UpdateListingDto listings, Guid id)
    {
        var listingLookUp = await _listings.GetByIdAsync(id);
        if (listingLookUp == null) return false;

        listingLookUp.Title = listings.Title;
        listingLookUp.Description = listings.Description;
        listingLookUp.Price = listings.Price;
        listingLookUp.Condition = listings.Condition;
        listingLookUp.UpdatedAt = DateTime.UtcNow;

        await _listings.UpdateAsync(listingLookUp, id);
        return true;
    }

    public async Task<bool> DeleteListings(Guid id)
    {
        var listing = await _listings.GetByIdAsync(id);
        if (listing == null) return false;

        await _listings.DeleteByIdAsync(id);
        return true;
    }
}
