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
    IReadOnlyList<ReservationListingSummaryDto> Listings,
    decimal TotalPrice,
    bool IsBundle,
    int UnreadCount,
    string? LastMessagePreview,
    DateTime? LastMessageAt,
    decimal SubTotal = 0m,
    decimal DiscountAmount = 0m,
    int? BundleDiscountPercent = null
);
