using Modules.Listings.Models;

namespace Modules.Listings.Risk;

public interface IListingRiskScoreService
{
    Task<RiskScoreResult> ScoreAsync(Listing listing, CancellationToken ct = default);
}
