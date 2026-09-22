namespace Modules.Reservations.Models.Dto;

public record KnapsackItem(Guid ListingId, decimal Price); //

public record KnapsackResult(
    IReadOnlyList<Guid> Selected,
    IReadOnlyList<Guid> Excluded,
    decimal TotalCost
);

public record SmartBudgetPreviewDto(
    IReadOnlyList<Guid> WouldReserve,
    decimal TotalCost,
    IReadOnlyList<Guid> Excluded,
    decimal Subtotal,
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
}

public record ReserveMultipleResultDto(
    Guid? ReservationId,
    Guid SellerId,
    IReadOnlyList<ReservedItemDto> Reserved,
    IReadOnlyList<Guid> FailedListingIds,
    decimal Subtotal=0m,
    decimal Total=0m,
    int? DiscountPercent=null,
    bool BundleBroken=false
);

public record ReservationItemDto(Guid ListingId, string Title, decimal Price);

public record SellerReservationDto(
    Guid ReservationId,
    Guid SellerId,
    string SellerInitials,
    IReadOnlyList<ReservationItemDto> Items,
    decimal SubTotal
);

public record ReservedItemDto(Guid ListingId, string Title, decimal Price, Guid SellerId);

public record NotReservedItemDto(Guid ListingId, string Title, decimal Price, string Reason);

public record SmartBudgetBatchResultDto(
    decimal TotalSpent,
    IReadOnlyList<SellerReservationDto> Reservations,
    IReadOnlyList<ReservedItemDto> Reserved,
    IReadOnlyList<NotReservedItemDto> NotReserved
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
public record SellerBundlePreviewDto(Guid SellerId, int SelectedCount, int ChosenCOunt, decimal Subtotal,int? DiscountPercent, decimal Discount, decimal Total, int? RuleMinItems,int? RulePercent);
public sealed record PlannedGroup(Guid SellerId, string SellerInitials,IReadOnlyList<Guid> ListingId,decimal SubTotal, int? DiscountPercent, decimal Total, BundleRule? Rule);
public sealed record Plan(IReadOnlyList<PlannedGroup> Groups, IReadOnlyList<NotReservedItemDto> NotReserved, IReadOnlyList<SellerBundlePreviewDto> Sellers, IReadOnlyDictionary<Guid,SmartBudgetCandidate> Candidates, decimal SubTotal, decimal TotalCost);
