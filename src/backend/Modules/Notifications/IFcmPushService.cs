
namespace Modules.Notifications;

public interface IFcmPushService
{
    Task<bool> SendAsync(
        Guid userId,
        string title,
        string body,
        CancellationToken ct = default
    );

    Task RegisterTokenAsync(
        Guid userId,
        string token,
        string platform,
        CancellationToken ct = default
    );
}
