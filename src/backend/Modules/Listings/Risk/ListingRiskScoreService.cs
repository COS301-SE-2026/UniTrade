using Modules.Listings.Models;
using Modules.Listings.Repositories;
using Modules.SharedKernel;
using Modules.Identity.Repositories;
using Modules.Reputation.Repositories;

namespace Modules.Listings.Risk;

public class ListingRiskScoreService : IListingRiskScoreService
{
    private readonly IListingRepository _listings;
    private readonly IListingImageRepository _images;
    private readonly IPerceptualHashService _hashing;
    private readonly IStrikeRepository _strikes;
    private readonly IUserRepository _users;

    private const int MinComparableSampleSize = 3;
    private const decimal LowRiskUpperBound = 39m;
    private const decimal MediumRiskUpperBound = 69m;
    private const int FullVisibilityScore = 100;
    private const int MinMediumVisibilityScore = 20;
    private const int DuplicateHashThreshold = 8;

    private const decimal PriceSignalWeight = 0.4m;
    private const decimal SellerHistorySignalWeight = 0.3m;
    private const decimal DuplicateSignalWeight = 0.3m;

    //seller hsitory sub signals
    private const decimal RatingSubWeight = 0.5m;
    private const decimal StrikeSubWeight = 0.5m;
    private const int StrikeRiskPerStrike = 34;

    public ListingRiskScoreService(IListingRepository listings, IListingImageRepository images, IPerceptualHashService hashing, IUserRepository users, IStrikeRepository strikes)
    {
        _listings = listings;
        _images = images;
        _hashing = hashing;
        _users = users;
        _strikes = strikes;
    }

    public async Task<RiskScoreResult> ScoreAsync(Listing listing, CancellationToken ct = default)
    {
        var reasons = new List<string>();
        var priceScore = await ComputePriceDeviationScoreAsync(listing, reasons, ct);
        var duplicateSore = await ComputeDuplicateImageScoreAsync(listing, reasons, ct);

        var combinedScore = CombineSignals(
            (priceScore, PriceSignalWeight),
            (duplicateSore, DuplicateSignalWeight)
        );
        var level = combinedScore > MediumRiskUpperBound ? "high" : combinedScore > LowRiskUpperBound ? "medium" : "low";

        int? visibilityScore = level switch
        {
            "low" => FullVisibilityScore,
            "medium" => (int)Math.Max(MinMediumVisibilityScore, FullVisibilityScore - combinedScore),
            _ => null,
        };
        return new RiskScoreResult(combinedScore, level, visibilityScore, reasons);
    }

    private static decimal CombineSignals(params (decimal? Score, decimal Weight)[] signals)
    {
        decimal weightedSum = 0m;
        decimal totalWeight = 0m;

        foreach (var (score, weight) in signals)
        {
            if (score is null)
            {
                continue;
            }
            weightedSum += score.Value * weight;
            totalWeight += weight;
        }
        return totalWeight == 0m ? 0m : weightedSum / totalWeight;
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

        if (comparablePrices.Count < MinComparableSampleSize)
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

        if (score > LowRiskUpperBound)
        {
            reasons.Add("price_anomaly");
        }
        return score;
    }

    private async Task<decimal?> ComputeDuplicateImageScoreAsync(Listing listing, List<string> reasons, CancellationToken ct)
    {
        var ownHashes = listing
            .Images.Where(img => img.PerceptualHash != null)
            .Select(img => img.PerceptualHash!)
            .ToList();
        if (ownHashes.Count == 0)
        {
            return null;
        }
        var comparablePool = await _images.GetComparableImageHashesAsync(listing.ListingId, ct);

        if (comparablePool.Count == 0)
        {
            return 0m;
        }
        var hasCrossSellerMatch = ownHashes.Any(ownHash =>
            comparablePool.Any(candidate =>
                candidate.SellerId != listing.SellerId
                && _hashing.HammingDistance(ownHash, candidate.Hash) <= DuplicateHashThreshold));

        if (hasCrossSellerMatch)
        {
            reasons.Add("duplicate_image");
            return 100m;
        }
        return 0m;
    }
}
