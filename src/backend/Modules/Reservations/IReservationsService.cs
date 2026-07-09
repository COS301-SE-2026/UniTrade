namespace Modules.Reservations;

public interface IReservationsService
{
    Task<bool> IsUserReserved(Guid userId, Guid reservationId);
}
