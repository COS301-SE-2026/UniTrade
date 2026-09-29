namespace Modules.Reservations;

public sealed record BundleCandidate(Guid ListingId, Guid SellerId, decimal Price);

public sealed record SellerBundleResult(
    Guid SellerId,
    IReadOnlyList<Guid> ListingIds,
    decimal Subtotal,
    int? DiscountPercent,
    decimal Discount,
    decimal Total
);

public sealed record BundleSelection(
    IReadOnlyList<SellerBundleResult> Sellers,
    IReadOnlyList<Guid> Excluded,
    decimal Subtotal,
    decimal TotalCost
)
{
    public IReadOnlyList<Guid> Selected => Sellers.SelectMany(s => s.ListingIds).ToList();
}

public static class BundleKnapsack
{
    private const long _unreachable = long.MaxValue / 4;
    public const decimal MaxSupportedBudget = 1_000_000_000m;

    public static BundleSelection Solve(
        IReadOnlyList<BundleCandidate> items,
        IReadOnlyDictionary<Guid, BundleRule> rules,
        decimal maxBudget
    )
    {
        ArgumentNullException.ThrowIfNull(items);
        ArgumentNullException.ThrowIfNull(rules);
        if (items.Select(i => i.ListingId).Distinct().Count() != items.Count)
            throw new ArgumentException("Duplicate listing ids.", nameof(items));

        if (items.Any(i => i.Price < 0m))
            throw new ArgumentException("Negative price.", nameof(items));

        var allIds = items.Select(i => i.ListingId).ToList();
        if (items.Count == 0 || maxBudget < 0m)
            return new BundleSelection(Array.Empty<SellerBundleResult>(), allIds, 0m, 0m);

        var budgetCents = (long)Math.Floor(Math.Min(maxBudget, MaxSupportedBudget) * 100m);

        var sellers = items
            .GroupBy(i => i.SellerId)
            .OrderBy(g => g.Key)
            .Select(g => new SellerBlock(
                g.Key,
                rules.GetValueOrDefault(g.Key),
                g.OrderBy(i => BundlePricing.ToCents(i.Price)).ThenBy(i => i.ListingId).ToList()
            ))
            .ToList();

        var total = items.Count;
        var dp = Enumerable.Repeat(_unreachable, total + 1).ToArray();
        dp[0] = 0;

        var choice = new int[sellers.Count][];
        var processed = 0;

        for (var s = 0; s < sellers.Count; s++)
        {
            var costs = sellers[s].CostsByCount();
            var next = Enumerable.Repeat(_unreachable, total + 1).ToArray();
            choice[s] = new int[total + 1];

            for (var j = 0; j <= processed; j++)
            {
                if (dp[j] >= _unreachable)
                    continue;
                for (var k = 0; k < costs.Length; k++)
                {
                    var cost = dp[j] + costs[k];
                    if (cost < next[j + k])
                    {
                        next[j + k] = cost;
                        choice[s][j + k] = k;
                    }
                }
            }
            dp = next;
            processed += sellers[s].Items.Count;
        }

        var best = 0;
        for (var j = total; j >= 0; j--)
            if (dp[j] <= budgetCents)
            {
                best = j;
                break;
            }

        var take = new int[sellers.Count];
        var remaining = best;
        for (var s = sellers.Count - 1; s >= 0; s--)
        {
            take[s] = choice[s][remaining];
            remaining -= take[s];
        }

        var results = new List<SellerBundleResult>();
        var selected = new HashSet<Guid>();
        long subtotalSum = 0,
            totalSum = 0;

        for (var s = 0; s < sellers.Count; s++)
        {
            var k = take[s];
            if (k == 0)
                continue;
            var block = sellers[s];
            var chosen = block.Items.Take(k).ToList();
            var subtotalCents = chosen.Sum(i => BundlePricing.ToCents(i.Price));
            var totalCents = BundlePricing.TotalCents(subtotalCents, k, block.Rule);

            results.Add(
                new SellerBundleResult(
                    block.SellerId,
                    chosen.Select(i => i.ListingId).ToList(),
                    BundlePricing.FromCents(subtotalCents),
                    BundlePricing.AppliedPercent(k, block.Rule),
                    BundlePricing.FromCents(subtotalCents - totalCents),
                    BundlePricing.FromCents(totalCents)
                )
            );

            foreach (var i in chosen)
                selected.Add(i.ListingId);
            subtotalSum += subtotalCents;
            totalSum += totalCents;
        }

        return new BundleSelection(
            results,
            allIds.Where(id => !selected.Contains(id)).ToList(),
            BundlePricing.FromCents(subtotalSum),
            BundlePricing.FromCents(totalSum)
        );
    }

    private sealed record SellerBlock(
        Guid SellerId,
        BundleRule? Rule,
        IReadOnlyList<BundleCandidate> Items
    )
    {
        public long[] CostsByCount()
        {
            var costs = new long[Items.Count + 1];
            long prefix = 0;
            for (var k = 1; k <= Items.Count; k++)
            {
                prefix += BundlePricing.ToCents(Items[k - 1].Price);
                costs[k] = BundlePricing.TotalCents(prefix, k, Rule);
            }
            return costs;
        }
    }
}
