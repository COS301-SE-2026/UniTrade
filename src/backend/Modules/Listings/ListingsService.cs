using Modules.Listings.Repositories;
using Modules.Listings.Models.Dto;
using Modules.Listings.Models;
using Modules.SharedKernel;
namespace Modules.Listings;

public class ListingService : IListingService
{
    private readonly IListingRepository _listings;

    public ListingService(IListingRepository listings) => _listings = listings;

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

    private static string? PrimaryImage(Listing l) =>
        l.Images.FirstOrDefault(i => i.IsPrimary)?.ImageUrl
        ?? l.Images.FirstOrDefault()?.ImageUrl;


    private static ListingSummaryDto MapToSummary(Listing l) => new(
     l.ListingId, l.SellerId,
     l.Title, l.Description, l.Price, l.Condition, l.ListingType,
     l.CourseId, l.Isbn, l.Author, l.Edition, l.ListingStatus,
     l.isBundle ?? false, l.ViewCount ?? 0,
     l.CreatedAt, l.UpdatedAt,
     l.Images
         .OrderByDescending(i => i.IsPrimary)
         .Select(i => new ListingImageDto(i.ImageId, i.ImageUrl, i.IsPrimary))
         .ToList());


    public async Task<ListingSummaryDto> CreateListings(ListingSummaryDto listings)
    {
        // will use azure blob storage ater
        //link dto to model. update server side
        var NewListings = new Listing
        {
            Title = listings.Title,
            Description = listings.Description,
            Price = listings.Price,
            Condition = listings.Condition,
            ListingType = listings.ListingType,
            Author = listings.Author,
            Isbn = listings.Isbn,
            Edition = listings.Edition,
            SellerId = listings.SellerId,
            //SellerName = listings.Seller.FirstName,   
            ListingStatus = listings.ListingStatus,
            ListingId = listings.ListingId,
            CourseId = listings.CourseId,
            isBundle = listings.IsBundle,
            ViewCount = listings.ViewCount,
            Images = listings.Images
            .Select(dto => new ListingImage
            {
                ImageId = dto.ImageId,
                ImageUrl = dto.path,
                IsPrimary = dto.IsPrimary
            }).ToList(),
            UpdatedAt = listings.UpdatedAt,
            CreatedAt = DateTime.UtcNow
        };

        //repo call
        await _listings.AddAsync(NewListings);

        return MapToSummary(NewListings);
    }

    public async Task<bool> UpdateListings(ListingSummaryDto listings, Guid id)
    {
        var listingLookUp = await _listings.GetByIdAsync(id);
        if (listingLookUp == null)
        {
            return false;
        }

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

        if (listing == null)
        {
            return false;
        }

        await _listings.DeleteByIdAsync(id);

        return true;
    }
}
