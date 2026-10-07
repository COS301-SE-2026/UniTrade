using Modules.Listings.Models;
namespace Modules.Listings.Risk;

public record RiskScoreResult(
    decimal Score,
    string Level,
    int? VisibilityScore,
    IReadOnlyList<RiskReason> Reasons
);
