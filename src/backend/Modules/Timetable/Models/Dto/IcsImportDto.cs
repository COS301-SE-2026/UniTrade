namespace Modules.Timetable.Models.Dto;

public sealed record ImportPatternDto(
    int DayOfWeek,
    string StartTime,
    string EndTime,
    string? Source,
    bool Clamped = false
);

public sealed record ImportSkippedDto(
    string Reason,
    int? DayOfWeek,
    string? StartTime,
    string? EndTime,
    string? Source
);

public sealed record ImportPreviewDto(
    IReadOnlyList<ImportPatternDto> Patterns,
    IReadOnlyList<ImportSkippedDto> Skipped,
    int TotalEventsRead
);

public sealed record ImportConflictDto(
    int DayOfWeek,
    string StartTime,
    string EndTime,
    string Reason
);

public sealed record ImportCommitResultDto(
    int Imported,
    IReadOnlyList<ImportConflictDto> Conflicts
);
