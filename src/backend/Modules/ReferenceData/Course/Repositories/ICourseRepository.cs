namespace Modules.ReferenceData.Course.Repositories;

public interface ICourseRepository
{
    Task<IReadOnlyDictionary<Course>> SearchAsync(
        string? search,
        int universityId,
        int limit,
        CancellationToken ct = default
    );

    Task<Course?> GetByIdAsync(int courseId, CancellationToken ct = default);
    Task<bool> ExistsAsync(int courseId, CancellationToken ct = default);
}
