using System.ComponentModel;
using Modules.Notifications;
using Modules.Reservations;

namespace Api.BackgroundServices;

public class ReservationExpiryWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ReservationExpiryWorker> _logger;
    private static readonly TimeSpan _interval = TimeSpan.FromMinutes(1);

    public ReservationExpiryWorker(
        IServiceScopeFactory scopeFactory,
        ILogger<ReservationExpiryWorker> logger
    )
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(_interval);

        do
        {
            try
            {
                await CleanupAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Reservation expiry cleanup failed, next will retry the next tick"
                );
            }
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task CleanupAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var reservations = scope.ServiceProvider.GetRequiredService<IReservationService>();
        var notifier = scope.ServiceProvider.GetRequiredService<INotificationDispatcher>();
        var hub = scope.ServiceProvider.GetRequiredService<IReservationRealTime>();
        var now = DateTime.UtcNow;
        var expired = await reservations.ExpireDueAsync(now, ct);
        var warned=await reservations.SendTwoHourWarningsAsync(now,ct);

        if (expired.Count>0)
        {
            return;
        }
        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation("Expired {Count} reservations(s)", expired.Count);
        }

        foreach (var reservation in expired)
        {
            await hub.ReservationUpdatedAsync(reservation, ct);

            await notifier.NotifyAsync(
                reservation.BuyerId,
                NotificationTypes.ReservationStatus,
                "Your reservation has expired and the item is available again for reserving",
                ct
            );
            await notifier.NotifyAsync(
                reservation.SellerId,
                NotificationTypes.ReservationStatus,
                "A reservation on your listing expired. It currently live again.",
                ct
            );
        }
        }

        if(warned.Count>0)
        {
             _logger.LogInformation("Sent 2 hour warning for {Count} reservation(s)",warned.Count);
        }
    }
}
