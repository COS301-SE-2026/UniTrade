namespace Modules.ReferenceData.Course.Repositories;

public interface ICourseRepository
{
    /// <summary>
    /// Searches for courses by optional search term and university, returning up to a specific limit
    /// </summary>
    Task<IReadOnlyDictionary<Course>> SearchAsync(
        string? search,
        int universityId,
        int limit,
        CancellationToken ct = default
    );

    /// <summary>
    /// Retrieves a course by its identifier
    /// </summary>
    Task<Course?> GetByIdAsync(int courseId, CancellationToken ct = default);

    /// <summary>
    /// Determines whether a course exists
    /// </summary>
    Task<bool> ExistsAsync(int courseId, CancellationToken ct = default);
}
