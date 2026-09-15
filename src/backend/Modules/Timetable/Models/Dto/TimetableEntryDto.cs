namespace Modules.Timetable.Models.Dto;

public class TimetableEntryDto
{
    public Guid EntryId { get; set; }
    public int DayOfWeek { get; set; }
    public string StartTime { get; set; } = null!;
    public string EndTime { get; set; } = null!;
}
