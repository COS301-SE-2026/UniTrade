using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Api.BackgroundServices;
using Castle.Core.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Modules.Notifications;
using Modules.Reservations;
using Modules.Reservations.Models;
using Modules.Reservations.Models.Dto;
using Moq;
using Xunit;

[Trait("Category", "Integration")]
public class ReservationExpiryWorkerTests
{
    // QR-04b Single failed worker cycle, Per-cycle failure isolation in background workers
    [Fact]
    public async Task Worker_ContinuesAfterFailedCycle_AndRunsNextCycle()
    {
        var callCount = 0;
        var gate = new TaskCompletionSource<bool>(
            TaskCreationOptions.RunContinuationsAsynchronously
        );

        var reservationsMock = new Mock<IReservationService>();
        reservationsMock
            .Setup(r => r.ExpireDueAsync(It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .Returns(
                (DateTime _, CancellationToken __) =>
                {
                    var n = Interlocked.Increment(ref callCount);
                    if (n == 1)
                        throw new InvalidOperationException("injected fault: first cycle fails");

                    // signalling once we reahced the 2nd call
                    gate.TrySetResult(true);
                    return Task.FromResult<IReadOnlyList<ReservationDto>>(Array.Empty<ReservationDto>());
                }
            );

        var services = new ServiceCollection();
        services.AddSingleton(reservationsMock.Object);
        services.AddSingleton(Mock.Of<INotificationDispatcher>());
        services.AddSingleton(Mock.Of<IReservationRealTime>());

        var provider = services.BuildServiceProvider();

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["Workers:ReservationExpiryIntervalSeconds"] = "1",
                }
            )
            .Build();

        var worker = new ReservationExpiryWorker(
            provider.GetRequiredService<IServiceScopeFactory>(),
            NullLogger<ReservationExpiryWorker>.Instance,
            config
        );

        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
        await worker.StartAsync(cts.Token);

        var reachedSecondCycle =
            await Task.WhenAny(gate.Task, Task.Delay(5000, cts.Token)) == gate.Task;
        await worker.StopAsync(CancellationToken.None);

        Assert.True(
            reachedSecondCycle,
            $"worker did not run second cycle after an injected failure (calls{callCount})"
        );
        Assert.True(
            callCount >= 2,
            $"expecting >=2 cycles, worker terminated after the failed cycle (calls{callCount})"
        );
    }
}
