using Microsoft.EntityFrameworkCore;

namespace Modules.Reservations.Repositories;

public interface IReservationRepository
{
    Task<bool> IsUserReservedAsync(string userId, Guid reservationId);
}