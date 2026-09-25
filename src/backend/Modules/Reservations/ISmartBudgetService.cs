using Modules.Listings.Repositories;
using Modules.Reservations.Models.Dto;
using Modules.Reservations.Repositories;

namespace Modules.Reservations;

public interface ISmartBudgetService
{
    Task<SmartBudgetPreviewDto> PreviewAsync(
        Guid buyerId,
        IReadOnlyList<Guid> listingId,
        decimal maxBudget,
        CancellationToken ct = default
    );
    Task<SmartBudgetBatchResultDto> ReserveAsync(
        Guid buyerId,
        IReadOnlyList<Guid> listingIds,
        decimal maxBudget,
        IReadOnlyDictionary<Guid, decimal>? expectedSellerTotals = null,
        CancellationToken ct = default
    );
    Task<SellerBundleSettings?> GetBundleDiscountAsync(
        Guid sellerId,
        CancellationToken ct = default
    );
    Task<SellerBundleSettings?> SetBundleDiscountAsync(
        Guid sellerId,
        BundleRule? rule,
        CancellationToken ct = default
    );
}
