using Microsoft.EntityFrameworkCore;
using Infrastructure.Persistence;
using Modules.Identity.Models;
using Modules.Notifications.Models;
namespace Modules.Notifications;

public class NotificationDispatcher : INotificationDispatcher
{
    private readonly AppDbContext _db;

    public NotificationDispatcher(AppDbContext db) => _db = db;

    public async Task NotifyAsync(Guid userId, string type, string message, CancellationToken ct = default)
    {
        _db.Notifications.Add(new Notification
        {
            UserId = userId,
            Type = type,
            Message = message,
            IsRead = false
        });

        await _db.SaveChangesAsync(ct);

        //  i didn't implement the full fcm flow ..
    }

}