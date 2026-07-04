using Modules.ReferenceData.Course.Models;
namespace Modules.ReferenceData.Course;

public interface ICourseService
{
    Task<IReadOnlyList<CourseDto>> SearchAsync(
        string? search,
        int? universityId,
        int limit,
        CancellationToken ct = default
    );

    Task<CourseDto?> GetByIdAsync(int courseId, CancellationToken ct = default);
}
