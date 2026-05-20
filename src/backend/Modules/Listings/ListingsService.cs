
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
}