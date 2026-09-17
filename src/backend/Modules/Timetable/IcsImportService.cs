using System.Globalization;
using System.Text;
using Ical.Net.DataTypes;
using Modules.Timetable.Models.Dto;

namespace Modules.Timetable;

public sealed class IcsImportService : IIcsImportService
{
    private const int _maxFileBytes = 2 * 1024 * 1024;
    private const int _maxDurationMinutes = 4 * 60;
    private static readonly TimeZoneInfo _sast = FindSast();

    private readonly ITimetableService _timetable;

    public IcsImportService(ITimetableService timetable)
    {
        _timetable = timetable;
    }

    public async Task<ImportPreviewDto> PreviewAsync(
        Stream icsStream,
        CancellationToken ct = default
    )
    {
        if (icsStream.CanSeek && icsStream.Length > _maxFileBytes)
            throw new TimetableException(TimetableErrors.ImportParseFailed);

        string content;
        using (var limited = new LimitedStream(icsStream, _maxFileBytes))
        using (var reader = new StreamReader(limited, Encoding.UTF8, leaveOpen: true))
        {
            content = await reader.ReadToEndAsync(ct);
        }

        if (string.IsNullOrEmpty(content))
            throw new TimetableException(TimetableErrors.ImportParseFailed);

        Ical.Net.Calendar calendar;
        try
        {
            calendar = Ical.Net.Calendar.Load(content);
        }
        catch (Exception)
        {
            throw new TimetableException(TimetableErrors.ImportParseFailed);
        }

        var patterns = new Dictionary<(int Day, TimeOnly Start, TimeOnly End), ImportPatternDto>();
        var skipped = new List<ImportSkippedDto>();
        var totalRead = 0;

        foreach (var ev in calendar.Events)
        {
            totalRead++;

            if (
                ev.RecurrenceRules is { Count: > 0 }
                || ev.RecurrenceDates is { Count: > 0 }
                || ev.ExceptionDates is { Count: > 0 }
            )
            {
                skipped.Add(
                    new ImportSkippedDto("recurrence_not_supported", null, null, null, ev.Summary)
                );
                continue;
            }
            if (ev.DtStart is null || ev.DtEnd is null)
            {
                skipped.Add(new ImportSkippedDto("missing_times", null, null, null, ev.Summary));
                continue;
            }

            DateTime startLocal;
            DateTime endLocal;
            try
            {
                startLocal = ToSast(ev.DtStart);
                endLocal = ToSast(ev.DtEnd);
            }
            catch
            {
                skipped.Add(new ImportSkippedDto("unreadable", null, null, null, ev.Summary));
                continue;
            }

            var start = TimeOnly.FromDateTime(startLocal);
            var end = TimeOnly.FromDateTime(endLocal);
            var day = (int)startLocal.DayOfWeek;
            var source = ev.Summary;

            if (end <= start)
            {
                skipped.Add(Skipped("invalid_range", day, start, end, source));
                continue;
            }

            var duration = (end.ToTimeSpan() - start.ToTimeSpan()).TotalMinutes;
            if (duration < 1 || duration > _maxDurationMinutes)
            {
                skipped.Add(Skipped("implausible_duration", day, start, end, source));
                continue;
            }

            var clamped = false;
            if (start < AvailabilityCalculator.WindowStart)
            {
                start = AvailabilityCalculator.WindowStart;
                clamped = true;
            }

            if (end > AvailabilityCalculator.WindowEnd)
            {
                end = AvailabilityCalculator.WindowEnd;
                clamped = true;
            }

            if (start >= end)
            {
                skipped.Add(Skipped("outside_window", day, start, end, source));
                continue;
            }

            var key = (day, start, end);
            if (patterns.TryGetValue(key, out var existing))
            {
                if (existing.Source != source)
                {
                    skipped.Add(Skipped("slot_conflict", day, start, end, source));
                }
                continue;
            }

            patterns[key] = new ImportPatternDto(
                day,
                FormatTime(start),
                FormatTime(end),
                source,
                clamped
            );
        }

        var ordered = patterns
            .Values.OrderBy(p => p.DayOfWeek)
            .ThenBy(p => p.StartTime, StringComparer.Ordinal)
            .ToList();

        return new ImportPreviewDto(ordered, skipped, totalRead);
    }

    // conflicts are collected and returned so the user can see
    // exactly which blocks didn't save and why. non-atomic for partial import
    public async Task<ImportCommitResultDto> CommitAsync(
        Guid userId,
        IReadOnlyList<ImportPatternDto> patterns,
        CancellationToken ct = default
    )
    {
        const int MaxPatternsImport = 50;
        if (patterns.Count > MaxPatternsImport)
            throw new TimetableException(TimetableErrors.ImportParseFailed);
        var imported = 0;
        var conflicts = new List<ImportConflictDto>();

        foreach (var pattern in patterns)
        {
            try
            {
                await _timetable.AddAsync(
                    userId,
                    new CreateTimetableEntryDto
                    {
                        DayOfWeek = pattern.DayOfWeek,
                        StartTime = pattern.StartTime,
                        EndTime = pattern.EndTime,
                    },
                    ct
                );
                imported++;
            }
            catch (TimetableException ex)
                when (ex.Message == TimetableErrors.OverlappingEntry
                    || ex.Message == TimetableErrors.InvalidTimeRange
                )
            {
                conflicts.Add(
                    new ImportConflictDto(
                        pattern.DayOfWeek,
                        pattern.StartTime,
                        pattern.EndTime,
                        ex.Message
                    )
                );
            }
        }

        return new ImportCommitResultDto(imported, conflicts);
    }

    private static ImportSkippedDto Skipped(
        string reason,
        int? day,
        TimeOnly? start,
        TimeOnly? end,
        string? source
    ) =>
        new(
            reason,
            day,
            start is null ? null : FormatTime(start.Value),
            end is null ? null : FormatTime(end.Value),
            source
        );

    private static DateTime ToSast(IDateTime value)
    {
        if (value.IsUtc)
            return TimeZoneInfo.ConvertTimeFromUtc(
                DateTime.SpecifyKind(value.Value, DateTimeKind.Utc),
                _sast
            );
        //  using floating time, the wall clock is already SAST
        // rotating it would shift every class by +2h
        if (value.TzId is null)
            return value.Value;

        return TimeZoneInfo.ConvertTimeFromUtc(value.AsUtc, _sast);
    }

    private static string FormatTime(TimeOnly t) =>
        t.ToString("HH:mm", CultureInfo.InvariantCulture);

    private static TimeZoneInfo FindSast()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Africa/Johannesburg");
        }
        catch (Exception ex) when (ex is TimeZoneNotFoundException or InvalidTimeZoneException)
        {
            return TimeZoneInfo.CreateCustomTimeZone(
                id: "SAST",
                baseUtcOffset: TimeSpan.FromHours(2),
                displayName: "South African Standard Time",
                standardDisplayName: "SAST"
            );
        }
    }

    private sealed class LimitedStream : Stream
    {
        private readonly Stream _inner;
        private long _remaining;
        private long _position;

        public override bool CanRead => _inner.CanRead;
        public override bool CanSeek => false;
        public override bool CanWrite => false;
        public override long Length => throw new NotSupportedException();
        public override long Position
        {
            get => _position;
            set => throw new NotSupportedException();
        }

        public override void Flush()
        {
            throw new NotSupportedException();
        }

        public override long Seek(long offset, SeekOrigin origin)
        {
            throw new NotSupportedException();
        }

        public override void SetLength(long value)
        {
            throw new NotSupportedException();
        }

        public override void Write(byte[] buffer, int offset, int count)
        {
            throw new NotSupportedException();
        }

        public LimitedStream(Stream inner, long remaining)
        {
            _inner = inner;
            _remaining = remaining;
        }

        public override int Read(byte[] buffer, int offset, int count)
        {
            var allowed = (int)Math.Min(count, _remaining + 1);
            var read = _inner.Read(buffer, offset, allowed);
            _remaining -= read;
            if (_remaining < 0)
                throw new TimetableException(TimetableErrors.ImportParseFailed);

            _position += read;
            return read;
        }

        public override async Task<int> ReadAsync(
            byte[] buffer,
            int offset,
            int count,
            CancellationToken cancellationToken
        )
        {
            var allowed = (int)Math.Min(count, _remaining + 1);

            var read = await _inner.ReadAsync(buffer, offset, allowed, cancellationToken);
            _remaining -= read;
            if (_remaining < 0)
                throw new TimetableException(TimetableErrors.ImportParseFailed);

            _position += read;
            return read;
        }
    }
}
