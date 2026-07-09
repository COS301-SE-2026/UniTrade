using Modules.Reservations.Repositories;

namespace Modules.Reservations;

public class ReservationsService()
{
    private readonly IReservationsRepository _reservationrepo;

    public async Task<bool> IsUserReserved(Guid userId, Guid reservationId) { }
}
