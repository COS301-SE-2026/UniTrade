using Modules.Reservations.Models.Dto;

namespace Modules.Reservations;

public interface IReservationService
{
    /// <summary>
    /// Creates a reservation for a live listing and flips to reserved
    /// </summary>
    Task<ReservationDto> CreateAsync(Guid listingId, Guid buyerId, CancellationToken ct = default);

    /// <summary>
    /// Seller responds to automated system chat
    /// </summary>
    Task<ReservationDto> AcknowledgeAsync(
        Guid reservationId,
        Guid callerId,
        CancellationToken ct = default
    );

    /// <summary>
    /// Buyer cancels any time??
    /// The seller only after 12 hr of buyer ghosting
    /// </summary>
    Task<ReservationDto> CancelAsync(
        Guid reservationId,
        Guid callerId,
        CancellationToken ct = default
    );

    Task<IReadOnlyList<ReservationListItemDto>> ListForUserAsync(
        Guid userId,
        string role,
        CancellationToken ct = default
    );

    Task<ReservationDto?> GetByIdAsync(
        Guid reservationId,
        Guid callerId,
        CancellationToken ct = default
    );

    // this is the same as your is user reserved, could change the naming though
    Task<bool> IsPartyToAsync(Guid reservationId, Guid userId, CancellationToken ct = default);

    Task<IReadOnlyList<ReservationDto>> ExpireDueAsync(
        DateTime asOf,
        CancellationToken ct = default
    );

    Task<IReadOnlyList<ReservationDto>> SendTwoHourWarningsAsync(
        DateTime asOfTime,
        CancellationToken ct
    );
}
