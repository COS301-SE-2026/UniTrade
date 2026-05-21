using Modules.Listings.Models;
using Modules.Listings.Models.Dto;
using Modules.Listings.Repositories;
using Modules.SharedKernel;

namespace Modules.Listings;

public interface IListingService
{
    Task<ListingSummaryDto> CreateListings(ListingSummaryDto listings);//retruning a listings-> so when
                                                             //users can see WHEN it was created and so on.P.s could be void, but retruning is stardard procedure.
    Task<bool> UpdateListings(ListingSummaryDto listings, Guid id);
    Task<bool> DeleteListings(Guid id);
    Task<ListingSummaryDto?> GetByIdAsync(Guid listingId);
    Task<PagedResult<ListingSummaryDto>> ListAsync(ListFilterDto filter);
}