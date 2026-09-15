namespace Modules.Timetable;

public sealed class TimetableException(string code) : Exception(code) { }

public static class TimetableErrors
{
    public const string InvalidTimeRange = "invalid_time_range";
    public const string EntryNotFound = "entry_not_found";
}
