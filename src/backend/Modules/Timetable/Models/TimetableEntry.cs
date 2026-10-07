namespace Modules.Timetable.Models;

public class TimetableEntry
{
    public Guid EntryId { get; set; }
    public Guid UserId { get; set; }
    public int DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public DateTime CreatedAt { get; set; }
}
