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

        var priceCents = items.Select(i => (int)Math.Round(i.Price * 100m, 0, MidpointRounding.AwayFromZero)).ToArray();
        var totalCents = priceCents.Sum();
        var budgetCents = (long)Math.Floor(maxBudget * 100m);
        var capacity = (int)Math.Min(budgetCents, (long)totalCents);

        var dp = new int?[n + 1, capacity + 1];
        dp[0, 0] = 0;

        for (var i = 1; i <= n; i++)
        {
            var price = priceCents[i - 1];

            for (var k = 0; k <= capacity; k++)
            {
                var skip = dp[i - 1, k];
                int? take = null;

                if (k >= price && dp[i - 1, k - price] is int prevCount)
                {
                    take = prevCount + 1;
                }
                dp[i, k] = (skip, take) switch
                {
                    (null, null) => null,
                    (int s, null) => s,
                    (null, int t) => t,
                    (int s, int t) => Math.Max(s, t),
                };
            }
        }

        var bestK = 0;
        for (var k = 0; k <= capacity; k++)
        {
            if (dp[n, k] is int count && count > bestK)
            {
                bestK = count;
            }
        }

        var bestCost = 0;
        for (var c = capacity; c >= 0; c--)
        {
            if (dp[n, c] == bestK)
            {
                bestCost = c;
                break;
            }
        }

        var totalCost = bestCost / 100m;

        var selectedIndexes = new List<int>();
        var ci = n;
        var ck = bestCost;

        while (ci > 0 && ck >= 0)
        {
            var price = priceCents[ci - 1];
            var takenValue = ck >= price && dp[ci - 1, ck - price] is int prevCount ? prevCount + 1 : (int?)null;

            if (takenValue is not null && takenValue == dp[ci, ck])
            {
                selectedIndexes.Add(ci - 1);
                ci--;
                ck -= price;
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
