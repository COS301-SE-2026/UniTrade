namespace Modules.Reservations.Models.Dto;

public record ReservationListingSummaryDto(
    Guid ListingId,
    string Title,
    decimal Price,
    string? ImagePath
);

public record CounterPartyDto(Guid UserId, string Name, string Initials);

public record ReservationListItemDto(
    Guid ReservationId,
    string ReservationStatus,
    string TimerStage,
    DateTime ExpiresAt,
    DateTime CreatedAt,
    CounterPartyDto CounterParty,
    ReservationListingSummaryDto Listing,
    int UnreadCount,
    string? LastMessagePreview,
    DateTime? LastMessageAt
);
