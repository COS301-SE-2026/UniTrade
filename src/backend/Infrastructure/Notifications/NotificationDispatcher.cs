using FirebaseAdmin.Messaging;
using Infrastructure.Persistence;
using Infrastructure.Realtime;
using Microsoft.Extensions.Logging;
using Modules.Notifications;
using Modules.Notifications.Models;
using Modules.Notifications.Repositories;

namespace Infrastructure.Notifications;

public class NotificationDispatcher : INotificationDispatcher
{
    private readonly AppDbContext _db;
    private readonly IFcmPushService _fcm;
    private readonly ConnectionTracker _tracker;
    private readonly ILogger<NotificationDispatcher> _logger;

    public NotificationDispatcher(
        AppDbContext db,
        IFcmPushService fcm,
        ConnectionTracker tracker,
        ILogger<NotificationDispatcher> logger
    )
    {
        _db = db;
        _fcm = fcm;
        _tracker = tracker;
        _logger = logger;
    }

    public async Task NotifyAsync(
        Guid userId,
        string type,
        string message,
        CancellationToken ct = default
    )
    {
        _db.Notifications.Add(
            new Modules.Notifications.Models.Notification
            {
                UserId = userId,
                Type = type,
                Message = message,
                IsRead = false,
            }
        );

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Notify: user={UserId}, online={IsOnline}, type={Type}",
            userId,
            _tracker.IsOnline(userId),
            type
        );

        if (_tracker.IsOnline(userId))
        {
            return;
        }
        await _fcm.SendAsync(userId, MapTitle(type), message, ct);
    }

    private static string MapTitle(string type) =>
        type switch
        {
            "chat" => "New message",
            "reservation_status" => "Reservation update",
            "meetup_reminder" => "Meetup reminder",
            "listing_status" => "Listing update",
            "verification" => "Verification update",
            _ => "UT",
        };
}
