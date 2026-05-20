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
    l.ListingId, l.SellerId, l.Seller?.FullName ?? "",
    l.Title, l.Description, l.Price, l.Condition, l.ListingType,
    l.CourseId, l.Isbn, l.Author, l.Edition, l.ListingStatus,
    l.isBundle ?? false, l.ViewCount ?? 0,
    l.CreatedAt, l.UpdatedAt,
    l.Images
        .OrderByDescending(i => i.IsPrimary)
        .Select(i => new ListingImageDto(i.ImageId, i.ImageUrl, i.IsPrimary))
        .ToList());

        
        public async Task<Listing> CreateListings(ListingSummaryDto listings)
        {
            //link dto to model. update server side
            var newlistings=new Listing
            {
                Title=listings.Title,
                Description=listings.Description,
                Price=listing.Price,
                Condition=listings.condition,
                Created_at=DateTime.UtcNow
            };

            //repo call
            await _listingrepo.AddAsync(newlistings);

            return newlistings;
        }

        public async Task<bool> UpdateListings(ListingSummaryDto listings, int id)
        {
            var listingLookUp=await _listingrepo.GetByIdAsync(id);
            if(listingLookUp==null)
            { 
                return false;
            }

            listingLookUp.Title=listings.Title;
            listingLookUp.Description=listings.Description;
            listingLookUp.Price=listings.Price;
            listingLookUp.Condition=listings.Condition;
            listingLookUp.Updated_at=DateTime.UtcNow;

            await _listingrepo.UpdateAsync(listingLookUp);

            return true;
        }

        public async Task<bool> DeleteListings(int id)
        {
            var listing=await _listingrepo.GetByIdAsync(id);

            if (listing==null)
            {
                return false;
            } 

            await _listingrepo.DeleteByIdAsync(id);

            return true;
        }
}
