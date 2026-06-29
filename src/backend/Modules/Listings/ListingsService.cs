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
            l.ListingId,
            l.SellerId,
            l.Title,
            l.Description,
            l.Price,
            l.Condition,
            l.ListingType,
            l.CourseId,
            l.Isbn,
            l.Author,
            l.Edition,
            l.ListingStatus,
            l.isBundle ?? false,
            l.ViewCount ?? 0,
            l.CreatedAt,
            l.UpdatedAt,
            l.Images.OrderByDescending(i => i.IsPrimary)
                .Select(i => new ListingImageDto(
                    i.ImageId,
                    $"/api/listings/{l.ListingId}/images/{i.ImageId}",
                    i.IsPrimary
                ))
                .ToList()
        );

    public async Task<ListingSummaryDto> CreateListings(CreateListingDto dto,Guid callerId)
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
            SellerId = callerId,
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

    public async Task<bool> UpdateListings(UpdateListingDto listings, Guid id,Guid callerId, CancellationToken ct= default)
    {
       
        // updates to text based fields
        var listingLookUp = await _listings.GetByIdTrackedAsync(id);
        if (listingLookUp == null)
            return false;

        if(listingLookUp.SellerId!=callerId)
        {
            throw new ForbiddenException("Only sellers can update listings");
        }

        listingLookUp.Title = listings.Title;
        listingLookUp.Description = listings.Description;
        listingLookUp.Price = listings.Price;
        listingLookUp.Condition = listings.Condition;
        listingLookUp.UpdatedAt = DateTime.UtcNow;
        await _listings.SaveAsync();

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

    public async Task<bool> DeleteListings(Guid id)
    {
        var listing = await _listings.GetByIdAsync(id);
        if (listing == null)
            return false;

        if(listing.SellerId!=callerId)
        {
            throw new ForbiddenException("Only sellers can delete listings");
        }

        foreach(var image in listing.Images)
        {
            await _images.DeleteAsync(image.ImageUrl);//this delet only has an interface???
        }

        await _listings.DeleteByIdAsync(id);
        return true;
    }
}
