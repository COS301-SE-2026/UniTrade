using Modules.Identity.Models;

namespace Modules.Notifications.Models;

public class DeviceToken
{
    public Guid DeviceTokenId { get; set; }
    public Guid UserId { get; set; }
    public string Token { get; set; } = null!;
    public string Platform { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime LastSeenAt { get; set; }

    public User? User { get; set; }
}
