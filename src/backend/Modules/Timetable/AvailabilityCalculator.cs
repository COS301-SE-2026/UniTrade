namespace Modules.Timetable;

public readonly record struct BusyBlock(int DayOfWeek, TimeOnly Start, TimeOnly End);

public readonly record struct WeeklySlot(int DayOfWeek, TimeOnly Start, TimeOnly End);

public readonly record struct DatedSlot(DateOnly Date, TimeOnly Start, TimeOnly End);

public static class AvailabilityCalculator
{
    public static readonly TimeOnly WindowStart = new(8, 0);
    public static readonly TimeOnly WindowEnd = new(20, 0);
    public static readonly TimeSpan MinimumSlotDuration = TimeSpan.FromMinutes(30);
    public static readonly TimeSpan BookingLeadTime = TimeSpan.FromMinutes(15);
    public const int ProjectionHorizonDays = 7;

    public static IReadOnlyList<DatedSlot> Compute(
        IReadOnlyList<BusyBlock> buyerBusy,
        IReadOnlyList<BusyBlock> sellerBusy,
        DateTime nowSast
    )
    {
        var weekly = ComputeWeekly(buyerBusy, sellerBusy);
        if (weekly.Count == 0)
            return Array.Empty<DatedSlot>();
        return Project(weekly, nowSast, ProjectionHorizonDays);
    }

    public static IReadOnlyList<WeeklySlot> ComputeWeekly(
        IReadOnlyList<BusyBlock> buyerBusy,
        IReadOnlyList<BusyBlock> sellerBusy
    )
    {
        var weekly = new List<WeeklySlot>();

        for (int day = 0; day < 7; day++)
        {
            var buyerDay = buyerBusy
                .Where(b => b.DayOfWeek == day)
                .Select(b => new TimeRange(b.Start, b.End))
                .ToList();

            var sellerDay = sellerBusy
                .Where(b => b.DayOfWeek == day)
                .Select(b => new TimeRange(b.Start, b.End))
                .ToList();

            var buyerFree = FreeWithin(buyerDay);
            var sellerFree = FreeWithin(sellerDay);
            var common = Intersect(buyerFree, sellerFree);
            var actualUsable = FilterMinDuration(common, MinimumSlotDuration);

            foreach (var r in actualUsable)
                weekly.Add(new WeeklySlot(day, r.Start, r.End));
        }
        return weekly;
    }

    private static IReadOnlyList<TimeRange> Merge(IEnumerable<TimeRange> ranges)
    {
        var sorted = ranges.OrderBy(r => r.Start).ToList();
        if (sorted.Count == 0)
            return Array.Empty<TimeRange>();

        var result = new List<TimeRange>();
        var current = sorted[0];

        for (int i = 1; i < sorted.Count; i++)
        {
            var next = sorted[i];
            if (next.Start <= current.End)
            {
                if (next.End > current.End)
                {
                    current = current with { End = next.End };
                }
            }
            else
            {
                result.Add(current);
                current = next;
            }
        }
        result.Add(current);
        return result;
    }

    private static IReadOnlyList<TimeRange> FreeWithin(IReadOnlyList<TimeRange> busy)
    {
        var clamped = new List<TimeRange>(busy.Count);
        foreach (var busySlot in busy)
        {
            var start = busySlot.Start < WindowStart ? WindowStart : busySlot.Start;
            var end = busySlot.End > WindowEnd ? WindowEnd : busySlot.End;
            if (start < end)
                clamped.Add(new TimeRange(start, end));
        }

        var merged = Merge(clamped);
        var free = new List<TimeRange>();
        var cursor = WindowStart;

        foreach (var b in merged)
        {
            if (b.Start > cursor)
                free.Add(new TimeRange(cursor, b.Start));
            if (b.End > cursor)
                cursor = b.End;
        }
        if (cursor < WindowEnd)
            free.Add(new TimeRange(cursor, WindowEnd));
        return free;
    }

    private static IReadOnlyList<TimeRange> Intersect(
        IReadOnlyList<TimeRange> a,
        IReadOnlyList<TimeRange> b
    )
    {
        var result = new List<TimeRange>();
        int i = 0,
            j = 0;

        while (i < a.Count && j < b.Count)
        {
            var start = a[i].Start > b[j].Start ? a[i].Start : b[j].Start;
            var end = a[i].End < b[j].End ? a[i].End : b[j].End;
            if (start < end)
                result.Add(new TimeRange(start, end));

            if (a[i].End < b[j].End)
                i++;
            else
                j++;
        }

        return Merge(result);
    }

    private static IReadOnlyList<TimeRange> FilterMinDuration(
        IReadOnlyList<TimeRange> ranges,
        TimeSpan min
    )
    {
        var result = new List<TimeRange>(ranges.Count);
        foreach (var range in ranges)
        {
            if (range.End.ToTimeSpan() - range.Start.ToTimeSpan() >= min)
                result.Add(range);
        }
        return result;
    }

    public static IReadOnlyList<DatedSlot> Project(
        IReadOnlyList<WeeklySlot> weekly,
        DateTime nowSast,
        int horizonDays
    )
    {
        var today = DateOnly.FromDateTime(nowSast);
        var horizonEnd = nowSast.AddDays(horizonDays);
        var slots = new List<DatedSlot>();

        var earliestStart = nowSast.AddMinutes(15);

        for (int offset = 0; offset <= horizonDays; offset++)
        {
            var date = today.AddDays(offset);
            int dayOfWeek = (int)date.DayOfWeek;

            foreach (var w in weekly)
            {
                if (w.DayOfWeek != dayOfWeek)
                    continue;
                var slotStart = date.ToDateTime(w.Start);
                var slotEnd = date.ToDateTime(w.End);

                if (slotEnd <= nowSast)
                    continue;

                var effectiveStart = slotStart < earliestStart ? earliestStart : slotStart;

                if (effectiveStart > horizonEnd)
                    continue;
                if (slotEnd - effectiveStart < MinimumSlotDuration)
                    continue;

                slots.Add(new DatedSlot(date, TimeOnly.FromDateTime(effectiveStart), w.End));
            }
        }
        slots.Sort(
            static (x, y) =>
            {
                var c = x.Date.CompareTo(y.Date);
                return c != 0 ? c : x.Start.CompareTo(y.Start);
            }
        );

        return slots;
    }

    private readonly record struct TimeRange(TimeOnly Start, TimeOnly End);
}
