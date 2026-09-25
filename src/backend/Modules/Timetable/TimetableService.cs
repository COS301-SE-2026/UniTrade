using System.Globalization;
using Modules.Timetable.Models;
using Modules.Timetable.Models.Dto;
using Modules.Timetable.Repositories;

namespace Modules.Timetable;

public class TimetableService : ITimetableService
{
    public static readonly TimeOnly WindowStart = new(8, 0);
    public static readonly TimeOnly WindowEnd = new(20, 0);
    private static readonly string[] _timeFormats = ["HH:mm", "H:mm"];

    private readonly ITimetableRepository _timetables;
    private readonly ITimetableNotifier _notifier;

    public TimetableService(ITimetableRepository timetables, ITimetableNotifier notifier)
    {
        _timetables = timetables;
        _notifier = notifier;
    }

    public async Task<IReadOnlyList<TimetableEntryDto>> ListMineAsync(
        Guid userId,
        CancellationToken ct = default
    )
    {
        var entries = await _timetables.ListForUserAsync(userId, ct);
        return entries.Select(MapToDto).ToList();
    }

    public async Task<TimetableEntryDto> AddAsync(
        Guid userId,
        CreateTimetableEntryDto dto,
        CancellationToken ct = default
    )
    {
        var (start, end) = Parse_Validate(dto);
        var sameDay = await _timetables.ListForUserAndDayAsync(userId, dto.DayOfWeek, ct);
        var overlaps = sameDay.Any(e => start < e.EndTime && e.StartTime < end);
        if (overlaps)
        {
            throw new TimetableException(TimetableErrors.OverlappingEntry);
        }

        var savedEntries = await _timetables.AddAsync(
            new TimetableEntry
            {
                UserId = userId,
                DayOfWeek = dto.DayOfWeek,
                StartTime = start,
                EndTime = end,
            },
            ct
        );
        var result = MapToDto(savedEntries);
        await _notifier.TimetableUpdatedAsync(userId, ct);
        return result;
    }

    public async Task DeleteAsync(Guid userId, Guid entryId, CancellationToken ct = default)
    {
        var deleted = await _timetables.DeleteOwnedAsync(entryId, userId, ct);
        if (!deleted)
        {
            throw new TimetableException(TimetableErrors.EntryNotFound);
        }
        await _notifier.TimetableUpdatedAsync(userId, ct);
    }

    public static (TimeOnly Start, TimeOnly End) Parse_Validate(CreateTimetableEntryDto dto)
    {
        if (dto.DayOfWeek is < 0 or > 6)
        {
            throw new TimetableException(TimetableErrors.InvalidTimeRange);
        }

        if (
            !TryParseLocalTime(dto.StartTime, out var start)
            || !TryParseLocalTime(dto.EndTime, out var end)
        )
        {
            throw new TimetableException(TimetableErrors.InvalidTimeRange);
        }

        if (end <= start || start < WindowStart || end > WindowEnd)
        {
            throw new TimetableException(TimetableErrors.InvalidTimeRange);
        }

        return (start, end);
    }

    private static bool TryParseLocalTime(string? value, out TimeOnly time)
    {
        time = default;
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        return TimeOnly.TryParseExact(
            value.Trim(),
            _timeFormats,
            CultureInfo.InvariantCulture,
            DateTimeStyles.None,
            out time
        );
    }

    private static TimetableEntryDto MapToDto(TimetableEntry entry) =>
        new()
        {
            EntryId = entry.EntryId,
            DayOfWeek = entry.DayOfWeek,
            StartTime = FormatTime(entry.StartTime),
            EndTime = FormatTime(entry.EndTime),
        };

    private static string FormatTime(TimeOnly time) =>
        time.ToString("HH:mm", CultureInfo.InvariantCulture);
}
