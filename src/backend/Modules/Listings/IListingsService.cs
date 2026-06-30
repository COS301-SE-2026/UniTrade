using Modules.Listings.Models;
using Modules.Listings.Models.Dto;
using Modules.SharedKernel;

namespace Modules.Listings;

public interface IListingService
{
    Task<ListingSummaryDto> CreateListings(CreateListingDto listings, Guid callerId);
    Task<bool> UpdateListings(
        UpdateListingDto listings,
        Guid id,
        Guid callerId,
        CancellationToken ct = default
    );
    Task<bool> DeleteListings(Guid id, Guid callerId);
    Task<ListingSummaryDto?> GetByIdAsync(Guid listingId);
    Task<PagedResult<ListingSummaryDto>> ListAsync(ListFilterDto filter);
}
