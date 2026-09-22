using Modules.Identity.Repositories;
using Modules.Listings.Models;
using Modules.Listings.Repositories;
using Modules.Listings.Scoring;
using Modules.Reputation.Repositories;
using Modules.SharedKernel;

namespace Modules.Listings.Risk;

public class ListingRiskScoreService : IListingRiskScoreService
{
    private readonly IListingRepository _listings;
    private readonly IListingImageRepository _images;
    private readonly IPerceptualHashService _hashing;
    private readonly IClipVisionClient _clip;
    private readonly IStrikeRepository _strikes;
    private readonly IUserRepository _users;

    private const decimal LowRiskUpperBound = 39m;
    private const decimal MediumRiskUpperBound = 69m;
    private const int DuplicateHashThreshold = 8;
    private const double DuplicateEmbeddingThreshold = 0.85;
    private const int _minComparableSampleSize = 3;
    private const decimal _lowRiskUpperBound = 39m;
    private const int _fullVisibilityScore = 100;
    private const int _minMediumVisibilityScore = 20;

    private const decimal PriceSignalWeight = 0.4m;
    private const decimal SellerHistorySignalWeight = 0.3m;
    private const decimal DuplicateSignalWeight = 0.3m;

    private const decimal RatingSubWeight = 0.5m;
    private const decimal StrikeSubWeight = 0.5m;
    private const int StrikeRiskPerStrike = 34;

    private const decimal HardPriceCeiling = 25_000m;
    private const decimal HighRiskScoreFloor = 70m;

    public ListingRiskScoreService(
        IListingRepository listings,
        IListingImageRepository images,
        IPerceptualHashService hashing,
        IClipVisionClient clip,
        IUserRepository users,
        IStrikeRepository strikes
    )
    {
        _listings = listings;
        _images = images;
        _hashing = hashing;
        _clip = clip;
        _users = users;
        _strikes = strikes;
    }

    public async Task<RiskScoreResult> ScoreAsync(Listing listing, CancellationToken ct = default)
    {
        var reasons = new List<RiskReason>();
        var priceScore = await ComputePriceDeviationScoreAsync(listing, reasons, ct);
        var duplicateSore = await ComputeDuplicateImageScoreAsync(listing, reasons, ct);
        var sellerHistoryScore = await ComputeSellerHistoryScoreAsync(listing, reasons, ct);

        var extremePrice = listing.Price > HardPriceCeiling;
        if (extremePrice && !reasons.Any(r => r.Code == "price_anomaly"))
        {
            reasons.Add(
                new RiskReason
                {
                    Code = "price_anomaly",
                    Detail =
                        $"R{listing.Price:N0} is above the R{HardPriceCeiling:N0} maximum for a campus listing",
                }
            );
        }

        var combinedScore = CombineSignals(
            (priceScore, PriceSignalWeight),
            (duplicateSore, DuplicateSignalWeight),
            (sellerHistoryScore, SellerHistorySignalWeight)
        );
        if (extremePrice)
        {
            combinedScore = Math.Max(combinedScore, HighRiskScoreFloor);
        }
        var level =
            combinedScore > MediumRiskUpperBound ? "high"
            : combinedScore > LowRiskUpperBound ? "medium"
            : "low";

        int? visibilityScore = level switch
        {
            "low" => _fullVisibilityScore,
            "medium" => (int)
                Math.Max(_minMediumVisibilityScore, _fullVisibilityScore - combinedScore),
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

    private async Task<decimal?> ComputePriceDeviationScoreAsync(
        Listing listing,
        List<RiskReason> reasons,
        CancellationToken ct
    )
    {
        var isBook = listing.CourseId.HasValue;
        var comparablePrices = await _listings.GetComparablePricesAsync(
            listing.CategoryId,
            isBook ? listing.CourseId : null,
            listing.ListingId,
            listing.SellerId,
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
            reasons.Add(
                new RiskReason
                {
                    Code = "price_anomaly",
                    Detail =
                        $"R{listing.Price:F2} vs uniform price R{mean:F2} among comparable listings",
                }
            );
            return 100m;
        }

        var zScore = Math.Abs((listing.Price - mean) / stdDev);
        var score = Math.Min(100m, zScore * (100m / 3m));

        if (score > _lowRiskUpperBound)
        {
            reasons.Add(
                new RiskReason
                {
                    Code = "price_anomaly",
                    Detail =
                        $"R{listing.Price:F2} vs average R{mean:F2} (+R{stdDev:F2}) across {comparablePrices.Count} comparable listings",
                }
            );
        }
        return score;
    }

    private async Task<decimal?> ComputeDuplicateImageScoreAsync(
        Listing listing,
        List<RiskReason> reasons,
        CancellationToken ct
    )
    {
        var ownImages = listing
            .Images.Where(img => img.PerceptualHash != null || img.Embedding != null)
            .ToList();

        if (ownImages.Count == 0)
        {
            return null;
        }

        var comparablePool = await _images.GetComparableImageHashesAsync(listing.ListingId, ct);
        var candidates = comparablePool.Where(c => c.SellerId != listing.SellerId).ToList();

        if (candidates.Count == 0)
        {
            return 0m;
        }

        foreach (var own in ownImages)
        {
            if (own.PerceptualHash is { } ownHash)
            {
                var hashMatch = candidates.FirstOrDefault(c =>
                    c.Hash != null
                    && _hashing.HammingDistance(ownHash, c.Hash) <= DuplicateHashThreshold
                );
                if (hashMatch is not null)
                {
                    reasons.Add(
                        new RiskReason
                        {
                            Code = "duplicate_image",
                            Detail =
                                "Matches an image already used in another seller's live listing",
                            ImageId = hashMatch.ImageId,
                        }
                    );
                    return 100m;
                }
            }

            if (own.Embedding is { Length: > 0 } ownEmbedding)
            {
                var embeddingMatch = candidates.FirstOrDefault(c =>
                    c.Embedding is { Length: > 0 } candidateEmbedding
                    && CosineSimilarity(ownEmbedding, candidateEmbedding)
                        >= DuplicateEmbeddingThreshold
                );
                if (embeddingMatch is not null)
                {
                    reasons.Add(
                        new RiskReason
                        {
                            Code = "duplicate_image",
                            Detail =
                                "Visually matches an image already used in another seller's live listing",
                            ImageId = embeddingMatch.ImageId,
                        }
                    );
                    return 100m;
                }
            }
        }

        return 0m;
    }

    private static double CosineSimilarity(float[] a, float[] b)
    {
        double dot = 0;
        for (int i = 0; i < a.Length && i < b.Length; i++)
        {
            dot += a[i] * b[i];
        }
        return dot;
    }

    private async Task<decimal?> ComputeSellerHistoryScoreAsync(
        Listing listing,
        List<RiskReason> reasons,
        CancellationToken ct
    )
    {
        var seller = await _users.GetByIdAsync(listing.SellerId);
        var trustScore = seller?.StudentProfile?.SellerTrustScore ?? 0m;

        decimal? ratingRisk =
            trustScore == 0m ? null : Math.Min(100m, Math.Max(0m, (5m - trustScore) / 4m * 100m));

        if (ratingRisk is > LowRiskUpperBound)
        {
            reasons.Add(
                new RiskReason
                {
                    Code = "low_seller_rating",
                    Detail = $"Seller rating {trustScore:F1}/5",
                }
            );
        }
        var strikeCount = await _strikes.CountForUserAsync(listing.SellerId, ct);
        decimal strikeRisk = Math.Min(100m, strikeCount * StrikeRiskPerStrike);

        if (strikeCount > 0)
        {
            reasons.Add(
                new RiskReason
                {
                    Code = "seller_strikes",
                    Detail = $"{strikeCount} prior strike(s) on record",
                }
            );
        }

        return CombineSignals((ratingRisk, RatingSubWeight), (strikeRisk, StrikeSubWeight));
    }
}
