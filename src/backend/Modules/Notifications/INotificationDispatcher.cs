namespace Modules.Notifications;

public interface INotificationDispatcher
{
    Task NotifyAsync(Guid userId, string type, string message, CancellationToken ct = default);
    // to write the notification but will only be used when we implement FCM, (just needed it for compilation purposes)
}
