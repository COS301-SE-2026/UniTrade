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
    IReadOnlyList<Guid> Excluded
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
