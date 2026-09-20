using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Modules.Identity.Verification;
using Modules.Reservations;
using Modules.Reservations.Availability;
using Modules.Reservations.Models;
using Modules.Reservations.Repositories;
using Modules.Reservations.StateMachine;
using Modules.Timetable;
using Modules.Timetable.Models;
using Modules.Timetable.Repositories;
using Moq;
using Xunit;

namespace UniTrade.Tests.Unit.Tests;

[Trait("Category", "Unit")]
public class AvailabilityServiceTests
{
    private readonly Mock<IReservationRepository> _reservations = new();
    private readonly Mock<ITimetableQueryForAvailability> _timetables = new();
    private readonly AvailabilityService _sut;

    private static readonly DateTimeOffset _fixedUtcNow = new(2026, 9, 21, 6, 0, 0, TimeSpan.Zero);

    public AvailabilityServiceTests()
    {
        _sut = new AvailabilityService(
            _reservations.Object,
            _timetables.Object,
            new StubTimeProvider(_fixedUtcNow)
        );
    }

    private static Reservation Res(Guid buyer, Guid seller, string status) =>
        new()
        {
            ReservationId = Guid.NewGuid(),
            BuyerId = buyer,
            SellerId = seller,
            ReservationStatus = status,
        };

    private static TimetableEntry Entry(int day, int sh, int sm, int eh, int em) =>
        new()
        {
            EntryId = Guid.NewGuid(),
            DayOfWeek = day,
            StartTime = new TimeOnly(sh, sm),
            EndTime = new TimeOnly(eh, sm == 0 && em == 0 ? 0 : em),
        };

    private sealed class StubTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }

    [Fact]
    public async Task CallerIsNotParty_ThrowsReservationNotFound()
    {
        var buyer = Guid.NewGuid();
        var seller = Guid.NewGuid();
        var snoopingStranger = Guid.NewGuid();

        _reservations
            .Setup(x => x.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Res(buyer, seller, ReservationState.Active));

        var ex = await Assert.ThrowsAsync<ReservationException>(() =>
            _sut.GetAvailabilityAsync(Guid.NewGuid(), snoopingStranger)
        );
        Assert.Equal(ReservationErrors.ReservationNotFound, ex.Message);
    }

    [Fact]
    public async Task NonActiveReservation_ThrowsReservationNotFound()
    {
        var buyer = Guid.NewGuid();
        var seller = Guid.NewGuid();

        _reservations
            .Setup(x => x.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Res(buyer, seller, ReservationState.Cancelled));

        var ex = await Assert.ThrowsAsync<ReservationException>(() =>
            _sut.GetAvailabilityAsync(Guid.NewGuid(), buyer)
        );
        Assert.Equal(ReservationErrors.ReservationNotFound, ex.Message);
    }

    [Fact]
    public async Task BuyerHasNoEntries_ReturnsMissingBuyer()
    {
        var buyer = Guid.NewGuid();
        var seller = Guid.NewGuid();

        _reservations
            .Setup(x => x.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Res(buyer, seller, ReservationState.Active));

        _timetables
            .Setup(x => x.ListForUserAsync(buyer, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<TimetableEntry>());
        _timetables
            .Setup(x => x.ListForUserAsync(seller, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { Entry(1, 10, 0, 11, 0) });

        var result = await _sut.GetAvailabilityAsync(Guid.NewGuid(), buyer);
        var m = Assert.IsType<AvailabilityResult.MissingTimetable>(result);

        Assert.Equal("buyer", m.Party);
    }

    [Fact]
    public async Task BothPartiesHaveNoEntries_ReturnsMissingBuyer()
    {
        var buyer = Guid.NewGuid();
        var seller = Guid.NewGuid();

        _reservations
            .Setup(x => x.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Res(buyer, seller, ReservationState.Active));

        _timetables
            .Setup(x => x.ListForUserAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<TimetableEntry>());

        var result = await _sut.GetAvailabilityAsync(Guid.NewGuid(), buyer);
        var m = Assert.IsType<AvailabilityResult.MissingTimetable>(result);

        Assert.Equal("buyer", m.Party);
    }

    [Fact]
    public async Task NoUsableCommonWindow_ReturnsNoOverlap()
    {
        var buyer = Guid.NewGuid();
        var seller = Guid.NewGuid();

        _reservations
            .Setup(x => x.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Res(buyer, seller, ReservationState.Active));

        var busyAllWeek = Enumerable.Range(0, 7).Select(d => Entry(d, 8, 0, 20, 0)).ToArray();

        _timetables
            .Setup(x => x.ListForUserAsync(buyer, It.IsAny<CancellationToken>()))
            .ReturnsAsync(busyAllWeek);
        _timetables
            .Setup(x => x.ListForUserAsync(seller, It.IsAny<CancellationToken>()))
            .ReturnsAsync(busyAllWeek);

        var result = await _sut.GetAvailabilityAsync(Guid.NewGuid(), buyer);
        Assert.IsType<AvailabilityResult.NoOverlap>(result);
    }

    [Fact]
    public async Task CommonFreeWindowExists_ReturnsOk()
    {
        var buyer = Guid.NewGuid();
        var seller = Guid.NewGuid();

        _reservations
            .Setup(x => x.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Res(buyer, seller, ReservationState.Active));

        _timetables
            .Setup(x => x.ListForUserAsync(buyer, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { Entry(1, 10, 0, 11, 0) });
        _timetables
            .Setup(x => x.ListForUserAsync(seller, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { Entry(1, 14, 0, 15, 0) });

        var result = await _sut.GetAvailabilityAsync(Guid.NewGuid(), buyer);
        var m = Assert.IsType<AvailabilityResult.Ok>(result);

        Assert.NotEmpty(m.Slots);
    }
}
