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

    Task AttachSellerInfoAsync(IReadOnlyCollection<Listing> listings);

    Task<Dictionary<Guid, int>> GetActiveListingCountsAsync(
        IEnumerable<Guid> sellerIds,
        CancellationToken ct = default
    );

    Task<bool> AdminRemoveAsync(Guid listingId, string reason, CancellationToken ct = default);

    Task<IReadOnlyList<Listing>> GetByGroupIdAsync(
        Guid groupId,
        bool includeRemoved = false,
        CancellationToken ct = default
    );
    Task DuplicateImagesToGroupAsync(Guid sourceListingId, CancellationToken ct = default);
    Task AddRangeAsync(IReadOnlyList<Listing> listings);
    Task<IReadOnlyList<decimal>> GetComparablePricesAsync(
        int categoryId,
        int? courseId,
        Guid excludeListingId,
        Guid excludeSellerId,
        CancellationToken ct = default
    );
    Task<Listing?> GetByIdAnyStatusAsync(Guid listingId);
    Task<int> CountHighRiskListingsForSellerAsync(
        Guid sellerId,
        Guid excludeListingId,
        CancellationToken ct = default
    );

    Task<bool> WarnSellerAsync(Guid listingId, string reason, CancellationToken ct = default);
    Task<bool> RestoreToLiveAsync(Guid listingId, CancellationToken ct = default);
    Task<bool> SetUnderReviewAsync(Guid listigId, string reason, CancellationToken ct = default);
}
