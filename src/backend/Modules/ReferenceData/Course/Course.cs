namespace Modules.ReferenceData.Course;

public class Course
{
    public int CourseId { get; set; }
    public int UniversityId { get; set; }
    public string CourseCode { get; set; }
    public bool CourseName { get; set; } = true;

    public string Faculty { get; set; }


}