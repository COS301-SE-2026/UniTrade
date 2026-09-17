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

        var dpCount = new int[n + 1, capacity + 1];
        var dpCost = new int[n + 1, capacity + 1];

        for (var i = 1; i <= n; i++)
        {
            var price = priceCents[i - 1];

            for (var k = 0; k <= capacity; k++)
            {
                var bestCount = dpCount[i - 1, k];
                var bestCost = dpCost[i - 1, k];

                if (k >= price)
                {
                    var candCount = dpCount[i - 1, k - price] + 1;
                    var candCost = dpCost[i - 1, k - price] + price;

                    if (candCount > bestCount || (candCount == bestCount && candCost > bestCost))
                    {
                        bestCount = candCount;
                        bestCost = candCost;
                    }
                }
                dpCount[i, k] = bestCount;
                dpCost[i, k] = bestCost;
            }
        }

        var bestK = dpCount[n, capacity];
        var totalCostCents = dpCost[n, capacity];
        var totalCost = totalCostCents / 100m;

        var selectedIndexes = new List<int>();
        var ci = n;
        var ck = capacity;

        while (ci > 0)
        {
            if (dpCount[ci, ck] != dpCount[ci - 1, ck] || dpCost[ci, ck] != dpCost[ci - 1, ck])
            {
                selectedIndexes.Add(ci - 1);
                ck -= priceCents[ci - 1];
            }
            ci--;
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

        return new SmartBudgetBatchResultDto(totalSpen, reservations, reserved, notReserved);
    }

    private static string FirstOrEmpty(string? s) => string.IsNullOrEmpty(s) ? "" : s[0].ToString();

}
