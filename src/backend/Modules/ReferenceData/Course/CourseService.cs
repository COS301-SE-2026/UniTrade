using System.Security.Cryptography.X509Certificates;

namespace Modules.ReferenceData.Course;

public class CourseService(ICourseRepository courses) : ICourseService
{
    private readonly ICourseRepository _courses = courses;

    public async Task<IReadOnlyList<CourseDto>> SearchAsync(string? search, int? universityId, int limit, CancellationToken ct = default)
    {
        
    }

}
