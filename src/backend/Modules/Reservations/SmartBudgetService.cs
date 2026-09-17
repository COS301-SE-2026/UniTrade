//using Infrastructure.Persistence.Repositories.Listings;
using Modules.Listings.Repositories;
using Modules.Reservations.Models.Dto;
namespace Modules.Reservations;

public class SmartBudgetService(IListingRepository listings, IReservationService reservationService) : ISmartBudgetService
{
    private readonly IListingRepository _listings = listings;
    private readonly IReservationService _reservationService = reservationService;

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

    public async Task<SmartBudgetBatchResultDto> ReserveAsync(Guid buyerId, IReadOnlyList<Guid> listingIds, decimal maxbudget, CancellationToken ct = default)
    {
        if (listingIds.Count == 0)
        {
            return new SmartBudgetBatchResultDto(
                TotalSpent: 0m,
                Reservations: Array.Empty<SellerReservationDto>(),
                Reserved: Array.Empty<ReservedItemDto>(),
                NotReserved: Array.Empty<NotReservedItemDto>()
            );
        }
        var resolved = new List<SellerGroupedItem>();
        var notFound = new List<Guid>();

        foreach (var id in listingIds)
        {
            var listing = await _listings.GetByIdAsync(id);
            if (listing is null)
            {
                notFound.Add(id);
                continue;
            }
            var initials = listing.Seller is { } seller ? $"{FirstOrEmpty(seller.FirstName)}{FirstOrEmpty(seller.LastName)}" : string.Empty;
            resolved.Add(new SellerGroupedItem(listing.ListingId, listing.SellerId, listing.Price, listing.Title, initials));
        }
        var byId = resolved.ToDictionary(x => x.ListingId);

        var knapsackItems = resolved.Select(x => new KnapsackItem(x.ListingId, x.Price)).ToList();
        var knapsck = Solve(knapsackItems, maxbudget);
        var overBudget = knapsck.Excluded.ToHashSet();

        var toReserve = resolved.Where(x => !overBudget.Contains(x.ListingId));
        var byseller = GroupBySeller(toReserve);

        var reservations = new List<SellerReservationDto>();
        var reserved = new List<ReservedItemDto>();
        var notReserved = new List<NotReservedItemDto>();
        var totalSpen = 0m;

        foreach (var (sellerId, items) in byseller)
        {
            var listingIdsForSeller = items.Select(i => i.ListingId).ToList();
            var result = await _reservationService.ReserveMultipleAsync(buyerId, sellerId, listingIdsForSeller, ct);

            if (result.ReservationId is Guid reservationId && result.Reserved.Count > 0)
            {
                var subTotal = result.Reserved.Sum(i => i.Price);
                totalSpen += subTotal;

                reservations.Add(new SellerReservationDto(
                    ReservationId: reservationId,
                    SellerId: sellerId,
                    SellerInitials: items[0].SellerInitials,
                    Items: result.Reserved.Select(i => new ReservationItemDto(
                        i.ListingId, i.Title, i.Price
                    )).ToList(),
                    SubTotal: subTotal
                ));
                reserved.AddRange(result.Reserved);
            }

            foreach (var failedId in result.FailedListingIds)
            {
                var item = byId[failedId];
                notReserved.Add(new NotReservedItemDto(
                    failedId, item.Title, item.Price, SmartBudgetReasons.Taken
                ));
            }
        }
        foreach (var excludedId in overBudget)
        {
            var item = byId[excludedId];
            notReserved.Add(new NotReservedItemDto(
                excludedId, item.Title, item.Price, SmartBudgetReasons.OverBudget
            ));
        }
        foreach (var missingId in notFound)
        {
            notReserved.Add(new NotReservedItemDto(missingId, "", 0m, SmartBudgetReasons.OverBudget));
        }

        return new SmartBudgetBatchResultDto(totalSpen, reservations, reserved, notReserved);
    }

    private static string FirstOrEmpty(string? s) => string.IsNullOrEmpty(s) ? "" : s[0].ToString();

}
