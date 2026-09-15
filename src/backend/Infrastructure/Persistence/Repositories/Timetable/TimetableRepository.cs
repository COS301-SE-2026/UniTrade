using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Modules.Timetable.Models;
using Modules.Timetable.Repositories;

namespace Infrastructure.Persistence.Repositories.Timetable;

public class TimetableRepository : ITimetableRepository
{
    private readonly AppDbContext _db;

    public TimetableRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<TimetableEntry>> ListForUserAsync(
        Guid userId,
        CancellationToken ct = default
    ) =>
        await _db
            .TimetableEntries.AsNoTracking()
            .Where(e => e.UserId == userId)
            .OrderBy(e => e.DayOfWeek)
            .ThenBy(e => e.StartTime)
            .ToListAsync(ct);

    public async Task<TimetableEntry> AddAsync(TimetableEntry entry, CancellationToken ct = default)
    {
        entry.EntryId = Guid.NewGuid();
        entry.CreatedAt = DateTime.UtcNow;
        _db.TimetableEntries.Add(entry);
        await _db.SaveChangesAsync(ct);
        return entry;
    }

    public Task<TimetableEntry?> GetByIdAsync(Guid entryId, CancellationToken ct = default) =>
        _db.TimetableEntries.AsNoTracking().FirstOrDefaultAsync(s => s.EntryId == entryId, ct);

    public async Task<bool> DeleteOwnedAsync(
        Guid entryId,
        Guid userId,
        CancellationToken ct = default
    )
    {
        var rowsAffected = await _db
            .TimetableEntries.Where(e => e.EntryId == entryId && e.UserId == userId)
            .ExecuteDeleteAsync(ct);
        return rowsAffected > 0;
    }
}
