using Modules.Reservations.Models.Dto;
using Modules.Reservations.Repositories;

namespace Modules.Reservations;

public class ReservationService : IReservationService
{
    private readonly IReservationRepository _reservations;

    public ReservationService(IReservationRepository reservations)
    {
        _reservations = reservations;
    }
    public async Task<bool> IsUserReserved(Guid userId, Guid reservationId)
    {
        return true;
    }

    public async Task<ReservationDto> CreateAsync(
        Guid listingId,
        Guid buyerId,
        CancellationToken ct = default
    )
    { return null; }

    public async Task<ReservationDto> AcknowledgeAsync(
        Guid reservationId,
        Guid callerId,
        CancellationToken ct = default
    )
    { return null; }

    public async Task<ReservationDto> CancelAsync(
        Guid reservationId,
        Guid callerId,
        CancellationToken ct = default
    )
    { return null; }

    public async Task<IReadOnlyList<ReservationListItemDto>> ListForUserAsync(
        Guid userId,
        string role,
        CancellationToken ct = default
    )
    { return null; }

    public async Task<ReservationDto?> GetByIdAsync(
        Guid reservationId,
        Guid callerId,
        CancellationToken ct = default
    )
    { return null; }

    public async Task<bool> IsPartyToAsync(Guid reservationId, Guid userId, CancellationToken ct = default) { return true; }

    public async Task<IReadOnlyList<ReservationDto>> ExpireDueAsync(
       DateTime sOf,
       CancellationToken ct = default
   )
    { return null; }

}
