using Modules.Reservations;
using Modules.Reservations.Models.Dto;
using Modules.Reservations.Repositories;

namespace Modules.Reservations;

public class SmartBudgetService(
    ISmartBudgetRepository smartBudget,
    IReservationService reservationService
) : ISmartBudgetService
{
    private readonly ISmartBudgetRepository _smartBudget = smartBudget;
    private readonly IReservationService _reservationService = reservationService;

    public const int MaxListingsPerRequest = 50;
    public const decimal MaxBudget = 1_000_000m;

    public async Task<SmartBudgetPreviewDto> PreviewAsync(
        Guid buyerId,
        IReadOnlyList<Guid> listingIds,
        decimal maxBudget,
        CancellationToken ct = default
    )
    {
        var plan = await BuildPlanAsync(buyerId, listingIds, maxBudget, ct);
        return new SmartBudgetPreviewDto(
            WouldReserve: plan.Groups.SelectMany(g => g.ListingIds).ToList(),
            TotalCost: plan.TotalCost,
            Excluded: plan.NotReserved.Where(n => n.Reason == SmartBudgetReasons.OverBudget)
                .Select(n => n.ListingId)
                .ToList(),
            SubTotal: plan.SubTotal,
            TotalDiscount: plan.SubTotal - plan.TotalCost,
            Unavailable: plan.NotReserved.Where(n => n.Reason != SmartBudgetReasons.OverBudget)
                .Select(n => n.ListingId)
                .ToList(),
            Sellers: plan.Sellers
        );
    }

    public static KnapsackResult Solve(IReadOnlyList<KnapsackItem> items, decimal maxBudget)
    {
        ArgumentNullException.ThrowIfNull(items);
        var candidates = items
            .Select(i => new BundleCandidate(i.ListingId, i.ListingId, i.Price))
            .ToList();
        var s = BundleKnapsack.Solve(candidates, new Dictionary<Guid, BundleRule>(), maxBudget);
        return new KnapsackResult(s.Selected, s.Excluded, s.TotalCost);
    }

    public static IReadOnlyDictionary<Guid, List<SellerGroupedItem>> GroupBySeller(
        IEnumerable<SellerGroupedItem> items
    ) => items.GroupBy(i => i.SellerId).ToDictionary(g => g.Key, g => g.ToList());

    public async Task<SmartBudgetBatchResultDto> ReserveAsync(
        Guid buyerId,
        IReadOnlyList<Guid> listingIds,
        decimal maxBudget,
        CancellationToken ct = default
    )
    {
        var plan = await BuildPlanAsync(buyerId, listingIds, maxBudget, ct);
        var reservations = new List<SellerReservationDto>();
        var notReserved = new List<NotReservedItemDto>(plan.NotReserved);
        var totalSpent = 0m;
        var reserved = new List<ReservedItemDto>();

        foreach (var group in plan.Groups)
        {
            var result = await _reservationService.ReserveMultipleAsync(
                buyerId,
                group.SellerId,
                group.ListingIds,
                group.Rule,
                group.Total,
                ct
            );

            if (result.ReservationId is Guid reservationId && result.Reserved.Count > 0)
            {
                totalSpent += result.Total;
                reservations.Add(
                    new SellerReservationDto(
                        reservationId,
                        group.SellerId,
                        group.SellerInitials,
                        result
                            .Reserved.Select(i => new ReservationItemDto(
                                i.ListingId,
                                i.Title,
                                i.Price
                            ))
                            .ToList(),
                        SubTotal: result.SubTotal,
                        Discount: result.SubTotal - result.Total,
                        DiscountPercent: result.DiscountPercent,
                        Total: result.Total
                    )
                );
                reserved.AddRange(result.Reserved);
            }

            var failed = result.FailedListingIds.ToHashSet();
            foreach (var id in failed)
                notReserved.Add(ToNotReserved(plan.Candidates[id], SmartBudgetReasons.Taken));

            if (result.BundleBroken)
                foreach (var id in group.ListingIds.Where(i => !failed.Contains(i)))
                    notReserved.Add(
                        ToNotReserved(plan.Candidates[id], SmartBudgetReasons.BundleBroken)
                    );
        }
        return new SmartBudgetBatchResultDto(totalSpent, reservations, reserved, notReserved);
    }

    public Task<SellerBundleSettings?> GetBundleDiscountAsync(
        Guid sellerId,
        CancellationToken ct = default
    ) => _smartBudget.GetSettingsAsync(sellerId, ct);

    public async Task<SellerBundleSettings?> SetBundleDiscountAsync(
        Guid sellerId,
        BundleRule? rule,
        CancellationToken ct = default
    )
    {
        if (!BundleDiscountRules.IsValid(rule?.MinItems, rule?.Percent))
        {
            throw new ArgumentException("Invalid bundle rule.", nameof(rule));
        }
        var ok = await _smartBudget.SetRuleAsync(sellerId, rule, ct);
        return ok ? new SellerBundleSettings(rule) : null;
    }

    private async Task<Plan> BuildPlanAsync(
        Guid buyerId,
        IReadOnlyList<Guid> requestIds,
        decimal maxBudget,
        CancellationToken ct
    )
    {
        var ids = requestIds.Distinct().ToList();
        var found = await _smartBudget.GetCandidatesAsync(ids, ct);
        var byId = found.ToDictionary(c => c.ListingId);

        var notReserved = new List<NotReservedItemDto>();
        var eligible = new List<SmartBudgetCandidate>();

        foreach (var id in ids)
        {
            if (!byId.TryGetValue(id, out var c))
                notReserved.Add(
                    new NotReservedItemDto(
                        id,
                        "Listing unavailable",
                        0m,
                        SmartBudgetReasons.Unavailable
                    )
                );
            else if (c.SellerId == buyerId)
                notReserved.Add(ToNotReserved(c, SmartBudgetReasons.OwnListing));
            else if (!c.SellerActive || c.Status == "removed")
                notReserved.Add(ToNotReserved(c, SmartBudgetReasons.Unavailable));
            else if (c.Status is "reserved" or "sold")
                notReserved.Add(ToNotReserved(c, SmartBudgetReasons.Taken));
            else if (c.Status != "live")
                notReserved.Add(ToNotReserved(c, SmartBudgetReasons.Unavailable));
            else
                eligible.Add(c);
        }
        var rules = await _smartBudget.GetBundleRulesAsync(
            eligible.Select(e => e.SellerId).Distinct().ToList(),
            ct
        );
        var solution = BundleKnapsack.Solve(
            eligible.Select(e => new BundleCandidate(e.ListingId, e.SellerId, e.Price)).ToList(),
            rules,
            maxBudget
        );
        var groups = solution
            .Sellers.Select(s => new PlannedGroup(
                s.SellerId,
                eligible.First(e => e.SellerId == s.SellerId).SellerInitials,
                s.ListingIds,
                s.Subtotal,
                s.DiscountPercent,
                s.Total,
                rules.GetValueOrDefault(s.SellerId)
            ))
            .ToList();

        foreach (var id in solution.Excluded)
            notReserved.Add(ToNotReserved(byId[id], SmartBudgetReasons.OverBudget));

        var sellers = eligible
            .GroupBy(e => e.SellerId)
            .Select(g =>
            {
                var rule = rules.GetValueOrDefault(g.Key);
                var chose = groups.FirstOrDefault(x => x.SellerId == g.Key);

                //Note to future @Zelamene, @Sabira: If there's time left after refinements implement truly precise affordability
                //  This current one is price-ish in the sense that in an attempt to prevent a case where seller's overbudget listings are still considered for the advising of
                // how many to add to unlock the discount.. it considered how many seller's cheapest items fot within the total budget at the
                // discounted price
                // it IGNORES contention with other sellers <--- this is what prompts a truly precise version

                var affordableCount = 0;
                if (rule is not null)
                {
                    var pricesAsc = g.OrderBy(e => BundlePricing.ToCents(e.Price)).ToList();
                    long runningSubtotalCents = 0;
                    var budgetCents = BundlePricing.ToCents(maxBudget);
                    for (var k = 1; k <= pricesAsc.Count; k++)
                    {
                        runningSubtotalCents += BundlePricing.ToCents(pricesAsc[k - 1].Price);
                        var discountedCents = BundlePricing.TotalCents(
                            runningSubtotalCents,
                            k,
                            rule
                        );
                        if (discountedCents <= budgetCents)
                            affordableCount = k;
                        else
                            break;
                    }
                }
                return new SellerBundlePreviewDto(
                    g.Key,
                    g.Count(),
                    chose?.ListingIds.Count ?? 0,
                    chose?.SubTotal ?? 0m,
                    chose?.DiscountPercent,
                    chose is null ? 0m : chose.SubTotal - chose.Total,
                    chose?.Total ?? 0m,
                    rule?.MinItems,
                    rule?.Percent,
                    affordableCount
                );
            })
            .ToList();
        return new Plan(groups, notReserved, sellers, byId, solution.Subtotal, solution.TotalCost);
    }

    private static NotReservedItemDto ToNotReserved(SmartBudgetCandidate c, string reason) =>
        new(c.ListingId, c.Title, c.Price, reason);
}
