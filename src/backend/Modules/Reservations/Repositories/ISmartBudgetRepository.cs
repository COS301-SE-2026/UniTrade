using Modules.Reservations.Models;
using Modules.Reservations.Models.Dto;

namespace Modules.Reservations.Repositories;

public sealed record SellerBundleSettings(BundleRule? Rule);

public interface ISmartBudgetRepository
{
    Task<IReadOnlyList<SmartBudgetCandidate>> GetCandidatesAsync(
        IReadOnlyCollection<Guid> listingsIds,
        CancellationToken ct = default
    );
    Task<IReadOnlyDictionary<Guid, BundleRule>> GetBundleRulesAsync(
        IReadOnlyCollection<Guid> sellerIds,
        CancellationToken ct = default
    );
    Task<SellerBundleSettings?> GetSettingsAsync(Guid sellerId, CancellationToken ct = default);
    Task<bool> SetRuleAsync(Guid sellerId, BundleRule? rule, CancellationToken ct = default);
}
