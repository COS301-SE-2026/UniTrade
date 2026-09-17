namespace Modules.Reservations.Models.Dto;

public record KnapsackItem(Guid ListingId, decimal Price);//

public record KnapsackResult(IReadOnlyList<Guid> Selected, IReadOnlyList<Guid> Excluded, decimal TotalCost);

public record SmartBudgetPreviewDto(IReadOnlyList<Guid> WouldReserve, decimal TotalCost, IReadOnlyList<Guid> Excluded);

public record SellerGroupedItem(Guid ListingId, Guid SellerId, decimal Price, string Title);

public static class SmartBudgetReasons
{
    public const string OverBudget = "over_budget";
    public const string Taken = "taken";
}

public record ReserveMultipleResultDto(
    Guid? ReservationId,
    Guid SellerId,
    IReadOnlyList<ReservationItemDto> Reserved,
    IReadOnlyList<Guid> FailedListingIds
);

public record ReservationItemDto(Guid ListingId, string Title, decimal Price);

public record SellerReservationDto(
    Guid ReservationId,
    Guid SellerId,
    string SellerInitials,
    IReadOnlyList<ReservationItemDto> Items,
    decimal SubTotal
);
