namespace Modules.Timetable.Models.Dto;

public class CreateTimetableEntryDto
{
    public int DayOfWeek { get; set; }
    public string StartTime { get; set; } = null!;
    public string EndTime { get; set; } = null!;
}
