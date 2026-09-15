namespace Modules.Reservations;

public interface IBroadCastService
{
    Task BroadCastStatusChange(Guid reservationId, string newStatus);
    Task SendToUserAsync(Guid userId, string eventName, object payload);
    Task NotifyAdminAsync(string eventName, object payload);
}
