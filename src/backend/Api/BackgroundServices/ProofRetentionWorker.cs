using Modules.Identity.Verification;

namespace Api.BackgroundServices;

public class ProofRetentionWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ProofRetentionWorker> _logger;
    private readonly TimeSpan _interval;
    private readonly int _retentionDays;

    public ProofRetentionWorker(IServiceScopeFactory scopeFactory, ILogger<ProofRetentionWorker> logger, IConfiguration? configuration = null)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;

        var hours = configuration?.GetValue<int>("Workers: ProofRetentionIntervalHours", 24) ?? 24;
        _interval = TimeSpan.FromHours(hours);
        _retentionDays = configuration?.GetValue<int>("Workers: ProofRetentionDays", 30) ?? 30;

    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(_interval);
        do
        {
            try
            {
                await PurgeAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Proof-of-registration retention sweep failed, next will retry the next tick"
                );
            }
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task PurgeAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var verification = scope.ServiceProvider.GetRequiredService<IVerificationService>();

        var purgedCount = await verification.PurgeExpiredProofOfRegistrationAsync(
            _retentionDays,
            ct
        );
        if (purgedCount == 0)
        {
            return;
        }
        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Purged {count} proof-of-registration document(s) past {RetentionDays}-day retention",
                purgedCount,
                _retentionDays
            );
        }
    }


}
