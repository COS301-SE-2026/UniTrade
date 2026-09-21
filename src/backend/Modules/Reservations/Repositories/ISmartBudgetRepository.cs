using Modules.Reservations.Models.Dto;
using Modules.Reservations.Models;

namespace Modules.Reservations.Repositories;

public sealed record SellerBundleSettings(BundleRule? Rule);

public interface ISmartBudgetRepository
{
    Task<IReadOnlyList<SmartBudgetCandidate>> GetCandidatesAsync(
        IReadOnlyCollection<Guid> listingsIds,
        CancellationToken ct = default
    );
}
