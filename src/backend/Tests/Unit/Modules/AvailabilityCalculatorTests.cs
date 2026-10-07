using System;
using System.Linq;
using Modules.Timetable;
using Xunit;

namespace UniTrade.Tests.Unit.Modules;

[Trait("Category", "Unit")]
public class AvailabilityCalculatorTests
{
    private static TimeOnly T(int h, int m = 0) => new(h, m);

    private static DateTime D(int y, int mo, int d, int h, int mi = 0) =>
        new(y, mo, d, h, mi, 0, DateTimeKind.Unspecified);

    private static BusyBlock B(int day, int sh, int sm, int eh, int em) =>
        new(day, T(sh, sm), T(eh, em));

    private static WeeklySlot W(int day, int sh, int sm, int eh, int em) =>
        new(day, T(sh, sm), T(eh, em));

    [Fact]
    public void ComputeWeekly_BothUsersBusy_ReturnsIntersectionOfFreeWindows()
    {
        var buyerBusy = new[] { B(1, 10, 0, 12, 0) };
        var sellerBusy = new[] { B(1, 14, 0, 15, 0) };

        var weekly = AvailabilityCalculator.ComputeWeekly(buyerBusy, sellerBusy);
        var monday = weekly.Where(w => w.DayOfWeek == 1).OrderBy(w => w.Start).ToList();

        Assert.Equal(3, monday.Count);
        Assert.Equal((T(8, 0), T(10, 0)), (monday[0].Start, monday[0].End));
        Assert.Equal((T(12, 0), T(14, 0)), (monday[1].Start, monday[1].End));
        Assert.Equal((T(15, 0), T(20, 0)), (monday[2].Start, monday[2].End));
    }

    [Fact]
    public void ComputeWeekly_BusyOverhangsWindow_ClampsBeforeInverting()
    {
        var buyerBusy = new[] { B(1, 6, 0, 9, 0) };
        var weekly = AvailabilityCalculator.ComputeWeekly(buyerBusy, Array.Empty<BusyBlock>());
        var monday = weekly.Where(w => w.DayOfWeek == 1).OrderBy(w => w.Start).ToList();

        Assert.Single(monday);
        Assert.Equal((T(9, 0), T(20, 0)), (monday[0].Start, monday[0].End));
    }

    [Fact]
    public void ComputeWeekly_NoBusy_WholeWeekFree()
    {
        var weekly = AvailabilityCalculator.ComputeWeekly(
            Array.Empty<BusyBlock>(),
            Array.Empty<BusyBlock>()
        );

        Assert.Equal(7, weekly.Count);
        Assert.All(
            weekly,
            w =>
            {
                Assert.Equal(T(8, 0), w.Start);
                Assert.Equal(T(20, 0), w.End);
            }
        );
    }

    [Fact]
    public void ComputeWeekly_CommonWindowExactly30Min_Kept()
    {
        var buyerBusy = new[] { B(1, 8, 0, 10, 0), B(1, 11, 0, 20, 0) };
        var sellerBusy = new[] { B(1, 8, 0, 10, 30), B(1, 11, 0, 20, 0) };

        var weekly = AvailabilityCalculator.ComputeWeekly(buyerBusy, sellerBusy);
        var monday = weekly.Where(w => w.DayOfWeek == 1).OrderBy(w => w.Start).ToList();
        Assert.Single(monday);
        Assert.Equal((T(10, 30), T(11, 0)), (monday[0].Start, monday[0].End));
    }

    [Fact]
    public void ComputeWeekly_CommonWindowUnder30Min_Dropped()
    {
        var buyerBusy = new[] { B(1, 8, 0, 10, 0), B(1, 11, 0, 20, 0) };
        var sellerBusy = new[] { B(1, 8, 0, 10, 31), B(1, 11, 0, 20, 0) };

        var weekly = AvailabilityCalculator.ComputeWeekly(buyerBusy, sellerBusy);
        var monday = weekly.Where(w => w.DayOfWeek == 1).OrderBy(w => w.Start).ToList();
        Assert.Empty(monday);
    }

    [Fact]
    public void Project_LateEveningNow_FindsDay7Occurrence()
    {
        var now = D(2026, 9, 21, 22, 0);
        var weekly = new[] { W(1, 9, 0, 10, 0) };

        var slots = AvailabilityCalculator.Project(weekly, now, 7);

        Assert.Single(slots);
        Assert.Equal(new DateOnly(2026, 9, 28), slots[0].Date);
    }

    [Fact]
    public void Project_RunningSlot_ClampedToEarliestBookable()
    {
        var now = D(2026, 9, 21, 10, 15);
        var weekly = new[] { W(1, 10, 0, 12, 0) };

        var slots = AvailabilityCalculator.Project(weekly, now, 7);

        var today = slots.Single(s => s.Date == new DateOnly(2026, 9, 21));
        Assert.Equal(T(10, 30), today.Start);
        Assert.Equal(T(12, 0), today.End);

        var nextWeek = slots.Single(s => s.Date == new DateOnly(2026, 9, 28));
        Assert.Equal(T(10, 0), nextWeek.Start);
        Assert.Equal(T(12, 0), nextWeek.End);
    }

    [Fact]
    public void Project_FutureSlot_Unchanged()
    {
        var now = D(2026, 9, 21, 8, 0);
        var weekly = new[] { W(1, 10, 0, 12, 0) };
        var slots = AvailabilityCalculator.Project(weekly, now, 7);

        Assert.Single(slots);
        Assert.Equal(T(10, 0), slots[0].Start);
        Assert.Equal(T(12, 0), slots[0].End);
    }

    [Fact]
    public void Project_FullyPastSlot_Dropped()
    {
        var now = D(2026, 9, 21, 10, 0);
        var weekly = new[] { W(1, 8, 0, 9, 0) };
        var slots = AvailabilityCalculator.Project(weekly, now, 7);

        Assert.DoesNotContain(slots, s => s.Date == new DateOnly(2026, 9, 21));
        Assert.Contains(slots, s => s.Date == new DateOnly(2026, 9, 28));
    }
}
