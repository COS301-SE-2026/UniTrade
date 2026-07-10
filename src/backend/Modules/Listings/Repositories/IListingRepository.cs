using Microsoft.EntityFrameworkCore;
using Modules.Listings.Models;
using Modules.Listings.Models.Dto;

namespace Modules.Listings.Repositories;

public interface IListingRepository
{
    Task<Listing?> GetByIdAsync(Guid listingId);
    Task<Listing?> GetByIdTrackedAsync(Guid id);
    Task<(IReadOnlyList<Listing> listings, int Total)> ListAsync(ListFilterDto listingFilterDto);
    Task AddAsync(Listing listings);
    Task SaveAsync();
    Task UpdateAsync(Listing listings, Guid id);
    Task DeleteByIdAsync(Guid id);

    Task<ListingCategory?> ResolveByNameAsync(string categoryName, CancellationToken ct = default);

    Task<bool> IsOwnerAsync(Guid listingId, Guid sellerId);

    Task<List<ListingCategory>> GetActiveCategories();

    Task MarkAllBySellerAsRemovedAsync(Guid sellerId, string reason);

    Task<bool> TryReserveAsync(Guid listingId, CancellationToken ct = default);

    Task<bool> ReleaseAsync(Guid listingId, CancellationToken ct = default);

}
