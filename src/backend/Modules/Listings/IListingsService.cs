using Modules.Listings.Models;
using Modules.Listings.Models.Dto;
using Modules.Listings.Repositories;
using Modules.SharedKernel;

namespace Modules.Listings;

public interface IListingService
{
    Task<ListingSummaryDto> CreateListings(ListingSummaryDto listings);
    Task<bool> UpdateListings(UpdateListingDto listings, Guid id);
    Task<bool> DeleteListings(Guid id);
    Task<ListingSummaryDto?> GetByIdAsync(Guid listingId);
    Task<PagedResult<ListingSummaryDto>> ListAsync(ListFilterDto filter);
}