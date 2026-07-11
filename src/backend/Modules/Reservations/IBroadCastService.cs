namespace Modules.Reservations;

public interface IBroadCastService
{
    Task BroadCastStatusChange(Guid reservationId, string newStatus);
}
