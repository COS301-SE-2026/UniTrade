using Modules.ReferenceData.Course.Models;
using Modules.ReferenceData.Course.Repositories;

namespace Modules.ReferenceData.Course;

public class CourseService(ICourseRepository courses) : ICourseService
{
    private readonly ICourseRepository _courses = courses;

    public async Task<IReadOnlyList<CourseDto>> SearchAsync(
        string? search,
        int? universityId,
        int limit,
        CancellationToken ct = default
    )
    {
        limit = Math.Clamp(limit, 1, 100);
        var courses = await _courses.SearchAsync(search, universityId, limit, ct);

        return courses.Select(c => new(c.CourseId, c.CourseCode, c.CourseName, c.Faculty)).ToList();
    }

    public async Task<CourseDto?> GetByIdAsync(int courseId, CancellationToken ct = default)
    {
        var course = await _courses.GetByIdAsync(courseId, ct);
        return course is null
            ? null
            : new CourseDto(course.CourseId, course.CourseCode, course.CourseName, course.Faculty);
    }
}
