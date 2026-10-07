using System.ComponentModel;
using Modules.Notifications;
using Modules.Reputation;
using Modules.Reservations;

namespace Api.BackgroundServices;

public class SuspensionExpiryWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SuspensionExpiryWorker> _logger;
    private readonly TimeSpan _interval;


    public SuspensionExpiryWorker(
        IServiceScopeFactory scopeFactory,
        ILogger<SuspensionExpiryWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;

        var seconds = 900;
        _interval = TimeSpan.FromSeconds(seconds);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(_interval);

        do
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var sanctions =
                    scope.ServiceProvider.GetRequiredService<IAccountSanctionService>();
                await sanctions.LiftExpiredSuspensionsAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Suspension expiry sweep failed, will try again next"
                );
            }
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
