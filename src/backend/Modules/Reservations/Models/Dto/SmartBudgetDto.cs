namespace Modules.Reservations.Models.Dto;

public record KnapsackItem(Guid ListingId, decimal Price);

public record KnapsackResult(
    IReadOnlyList<Guid> Selected,
    IReadOnlyList<Guid> Excluded,
    decimal TotalCost
);

public record SmartBudgetCandidate(
    Guid ListingId,
    Guid SellerId,
    decimal Price,
    string Title,
    string Status,
    bool SellerActive,
    string SellerInitials
);

public record SellerBundlePreviewDto(
    Guid SellerId,
    int SelectedCount,
    int ChosenCount,
    decimal SubTotal,
    int? DiscountPercent,
    decimal Discount,
    decimal Total,
    int? RuleMinItems,
    int? RulePercent,
    int AffordableCount = 0
);

public record SmartBudgetPreviewDto(
    IReadOnlyList<Guid> WouldReserve,
    decimal TotalCost,
    IReadOnlyList<Guid> Excluded,
    decimal SubTotal,
    decimal TotalDiscount,
    IReadOnlyList<Guid> Unavailable,
    IReadOnlyList<SellerBundlePreviewDto> Sellers
);

public record SellerGroupedItem(
    Guid ListingId,
    Guid SellerId,
    decimal Price,
    string Title,
    string SellerInitials
);

public static class SmartBudgetReasons
{
    public const string OverBudget = "over_budget";
    public const string Taken = "taken";
    public const string Unavailable = "unavailable";
    public const string OwnListing = "own_listing";
    public const string BundleBroken = "bundle_broken";
}

public record ReserveMultipleResultDto(
    Guid? ReservationId,
    Guid SellerId,
    IReadOnlyList<ReservedItemDto> Reserved,
    IReadOnlyList<Guid> FailedListingIds,
    decimal SubTotal = 0m,
    decimal Total = 0m,
    int? DiscountPercent = null,
    bool BundleBroken = false
);

public record ReservationItemDto(Guid ListingId, string Title, decimal Price);

public record SellerReservationDto(
    Guid ReservationId,
    Guid SellerId,
    string SellerInitials,
    IReadOnlyList<ReservationItemDto> Items,
    decimal SubTotal,
    decimal Discount = 0m,
    int? DiscountPercent = null,
    decimal Total = 0m
);

public record ReservedItemDto(Guid ListingId, string Title, decimal Price, Guid SellerId);

public record NotReservedItemDto(Guid ListingId, string Title, decimal Price, string Reason);

public record SmartBudgetBatchResultDto(
    decimal TotalSpent,
    IReadOnlyList<SellerReservationDto> Reservations,
    IReadOnlyList<ReservedItemDto> Reserved,
    IReadOnlyList<NotReservedItemDto> NotReserved
);

public sealed record PlannedGroup(
    Guid SellerId,
    string SellerInitials,
    IReadOnlyList<Guid> ListingIds,
    decimal SubTotal,
    int? DiscountPercent,
    decimal Total,
    BundleRule? Rule
);

public sealed record Plan(
    IReadOnlyList<PlannedGroup> Groups,
    IReadOnlyList<NotReservedItemDto> NotReserved,
    IReadOnlyList<SellerBundlePreviewDto> Sellers,
    IReadOnlyDictionary<Guid, SmartBudgetCandidate> Candidates,
    decimal SubTotal,
    decimal TotalCost
);
