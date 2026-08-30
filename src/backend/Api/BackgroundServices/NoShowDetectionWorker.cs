using Modules.Reservations;

namespace Api.BackgroundServices;

public class NoShowDetectionWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<NoShowDetectionWorker> _logger;
    private static readonly TimeSpan _interval = TimeSpan.FromMinutes(1);

    public NoShowDetectionWorker(IServiceScopeFactory scopeFactory, ILogger<NoShowDetectionWorker> logger)
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
                await DetectAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "No-show detection failed,next attempt will retry the next trick");
            }
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task DetectAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var meetups = scope.ServiceProvider.GetRequiredService<IMeetupService>();

        var now = DateTime.UtcNow;
        var resolved = await meetups.DetectNoShowsAsync(now, ct);

        if (resolved.Count == 0)
        {
            return;
        }

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation("Auto-resolved {Count} meetup(s) at end of check-in window", resolved.Count);
        }
    }
}
