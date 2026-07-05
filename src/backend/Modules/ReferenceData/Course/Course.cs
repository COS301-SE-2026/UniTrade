namespace Modules.ReferenceData.Course;

public class Course
{
    public int CourseId { get; set; }
    public int UniversityId { get; set; }
    public string CourseCode { get; set; } = null!;
    public string CourseName { get; set; } = null!;

    public string Faculty { get; set; } = null!;
}
