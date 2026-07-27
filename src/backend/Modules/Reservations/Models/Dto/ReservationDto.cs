namespace Modules.Reservations.Models.Dto;

public record ReservationDto(
    Guid ReservationId,
    Guid ListingId,
    Guid BuyerId,
    Guid SellerId,
    string ReservationStatus,
    string TimerStage,
    DateTime ExpiresAt,
    DateTime CreatedAt,
    DateTime? CompletedAt,
    CounterPartyDto? CounterParty
);
