namespace Modules.Reservations.Models.Dto;

public record KnapsackItem(Guid ListingId, decimal Price);//

public record KnapsackResult(IReadOnlyList<Guid> selected, IReadOnlyList<Guid> excluded, decimal totalCost);

public record SmartBudgetPreviewDto(IReadOnlyList<Guid> wouldReserve, decimal totalCost, IReadOnlyList<Guid> excluded);

public record SellerGroupItem(Guid ListingId, Guid SellerId, decimal Price, string Title);