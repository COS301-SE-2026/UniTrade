namespace Modules.Reservations.Models.Dto;

public record KnapsackItem(Guid ListingId, decimal Price);//

public record KnapsackResult(IReadOnlyList<Guid> Selected, IReadOnlyList<Guid> Excluded, decimal TotalCost);

public record SmartBudgetPreviewDto(IReadOnlyList<Guid> WouldReserve, decimal TotalCost, IReadOnlyList<Guid> Excluded);

public record SellerGroupedItem(Guid ListingId, Guid SellerId, decimal Price, string Title);
