using System.Drawing;
using Modules.ReferenceData.Course.Repositories;

namespace Infrastructure.Persistence.Repositories.Courses;

public class CourseRepository(AppDbContext db) : ICourseRepository
{
    private readonly AppDbContext _db = db;

    public async Task<IReadOnlyList<Course>> SearchAsync(
        string? search,
        int universityId,
        int limit,
        CancellationToken ct = default
    )
    {
        var query = _db.Courses.AsNoTracking();

        if (universityId is not null)
        {
            query = query.Where(c => c.UniversityId == universityId);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchInput = search.Trim();
            query = query.Where(c =>
                EF.Functions.ILike(
                    c.CourseCode,
                    $"%{searchInput}%" || EF.Functions.ILike(c.CourseName, $"%{searchInput}%")
                )
            );
        }
        return await query.OrderBy(c => c.CourseCode).Take(limit).ToListAsync(ct);
    }

    public async Task<Course?> GetByIdAsync(int courseId, CancellationToken ct = default) =>
        await _db.Courses.AsNoTracking().FirstOrDefaultAsync(c => c.CourseId == courseId, ct);

    public async Task<bool> ExistsAsync(int courseId, CancellationToken ct = default) =>
        await _db.Courses.AsNoTracking().AnyAsync(c => c.CourseId == courseId, ct);
}
