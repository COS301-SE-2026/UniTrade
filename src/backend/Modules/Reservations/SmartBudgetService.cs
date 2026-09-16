//using Infrastructure.Persistence.Repositories.Listings;
using Modules.Listings.Repositories;
using Modules.Reservations.Models.Dto;
namespace Modules.Reservations;

public class SmartBudgetService(IListingRepository listings) : ISmartBudgetService
{
    private readonly IListingRepository _listings = listings;

    public async Task<SmartBudgetPreviewDto> PreviewAsync(IReadOnlyList<Guid> listingsIds, decimal maxBudget, CancellationToken ct = default)
    {
        if (listingsIds.Count == 0)
        {
            return new SmartBudgetPreviewDto(
                WouldReserve: Array.Empty<Guid>(),
                TotalCost: 0m,
                Excluded: Array.Empty<Guid>()
            );
        }
        var candidates = new List<KnapsackItem>();
        var unresolved = new List<Guid>();

        foreach (var id in listingsIds)
        {
            var listing = await _listings.GetByIdAsync(id);
            if (listing is null)
            {
                unresolved.Add(id);
            }
            else
            {
                candidates.Add(new KnapsackItem(listing.ListingId, listing.Price));
            }
        }

        var result = Solve(candidates, maxBudget);
        var excluded = result.Excluded.Concat(unresolved).ToList();

        return new SmartBudgetPreviewDto(
            WouldReserve: result.Selected,
            TotalCost: result.TotalCost,
            Excluded: excluded
        );

    }

    public static KnapsackResult Solve(IReadOnlyList<KnapsackItem> items, decimal maxBudget)
    {
        ArgumentNullException.ThrowIfNull(items);

        var n = items.Count;
        if (n == 0 || maxBudget < 0)
        {
            return new KnapsackResult(
                Selected: Array.Empty<Guid>(),
                Excluded: items.Select(i => i.ListingId).ToList(),
                TotalCost: 0m
            );
        }

        var dp = new decimal?[n + 1, n + 1];
        dp[0, 0] = 0m;

        for (var i = 1; i <= n; i++)
        {
            var price = items[i - 1].Price;

            for (var k = 0; k <= n; k++)
            {
                var skip = dp[i - 1, k];
                decimal? take = null;

                if (k > 0 && dp[i - 1, k - 1] is decimal prevSum)
                {
                    var candidate = prevSum + price;
                    if (candidate <= maxBudget)
                    {
                        take = candidate;
                    }
                }
                dp[i, k] = (skip, take) switch
                {
                    (null, null) => null,
                    (decimal s, null) => s,
                    (null, decimal t) => t,
                    (decimal s, decimal t) => Math.Max(s, t),
                };
            }
        }

        var bestK = 0;
        for (var k = n; k >= 0; k--)
        {
            if (dp[n, k] is not null)
            {
                bestK = k;
                break;
            }
        }

        var totalCost = dp[n, bestK] ?? 0m;

        var selectedIndexes = new List<int>();
        var ci = n;
        var ck = bestK;

        while (ci > 0 && ck > 0)
        {
            var price = items[ci - 1].Price;
            var takenValue = dp[ci - 1, ck - 1] is decimal prevSum && prevSum + price <= maxBudget ? prevSum + price : (decimal?)null;

            if (takenValue is not null && takenValue == dp[ci, ck])
            {
                selectedIndexes.Add(ci - 1);
                ci--;
                ck--;
            }
            else
            {
                ci--;
            }
        }

        var selectedSet = selectedIndexes.ToHashSet();
        var selected = selectedIndexes.Select(idx => items[idx].ListingId).ToList();

        var excluded = items.Where((_, idx) => !selectedSet.Contains(idx)).Select(i => i.ListingId).ToList();

        return new KnapsackResult(
            Selected: selected,
            Excluded: excluded,
            TotalCost: totalCost
        );
    }

    public static IReadOnlyDictionary<Guid, List<SellerGroupedItem>> GroupBySeller(IEnumerable<SellerGroupedItem> items) =>
    items.GroupBy(i => i.SellerId).ToDictionary(g => g.Key, g => g.ToList());
}
