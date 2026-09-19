using Modules.Listings.Models;
using Modules.Listings.Repositories;

namespace Modules.Listings.Risk;

public class ListingRiskScoreService : IListingRiskScoreService
{
    private readonly IListingRepository _listings;
    private const int _minComparableSampleSize = 3;
    private const decimal _lowRiskUpperBound = 39m;
    private const decimal _mediumRiskUpperBound = 69m;
    private const int _fullVisibilityScore = 100;
    private const int _minMediumVisibilityScore = 20;

    public ListingRiskScoreService(IListingRepository listings)
    {
        _listings = listings;
    }

    public async Task<RiskScoreResult> ScoreAsync(Listing listing, CancellationToken ct = default)
    {
        var reasons = new List<string>();
        var priceDeviationScore = await ComputePriceDeviationScoreAsync(listing, reasons, ct);
        var combinedScore = priceDeviationScore ?? 0m;
        var level = combinedScore > _mediumRiskUpperBound ? "high" : combinedScore > _lowRiskUpperBound ? "medium" : "low";

        int? visibilityScore = level switch
        {
            "low" => _fullVisibilityScore,
            "medium" => (int)Math.Max(_minMediumVisibilityScore, _fullVisibilityScore - combinedScore),
            _ => null,
        };
        return new RiskScoreResult(combinedScore, level, visibilityScore, reasons);
    }


    private async Task<decimal?> ComputePriceDeviationScoreAsync(Listing listing, List<string> reasons, CancellationToken ct)
    {
        var isBook = listing.CourseId.HasValue;
        var comparablePrices = await _listings.GetComparablePricesAsync(
            listing.CategoryId,
            isBook ? listing.CourseId : null,
            listing.ListingId,
            ct
        );

        if (comparablePrices.Count < _minComparableSampleSize)
        {
            return null;
        }

        var mean = comparablePrices.Average();
        var variance = comparablePrices.Sum(p => (p - mean) * (p - mean) / comparablePrices.Count);
        var stdDev = (decimal)Math.Sqrt((double)variance);

        if (stdDev == 0m)
        {
            if (listing.Price == mean)
            {
                return 0m;
            }
            reasons.Add("price_anomaly");
            return 100m;
        }

        var zScore = Math.Abs((listing.Price - mean) / stdDev);
        var score = Math.Min(100m, zScore * (100m / 3m));

        if (score > _lowRiskUpperBound)
        {
            reasons.Add("price_anomaly");
        }
        return score;
    }
}
