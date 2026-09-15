using Modules.Timetable.Models;

namespace Modules.Timetable.Repositories;

public interface ITimetableRepository
{
    Task<IReadOnlyList<TimetableEntry>> ListForUserAsync(
        Guid userId,
        CancellationToken ct = default
    );

    Task<TimetableEntry> AddAsync(TimetableEntry entry, CancellationToken ct = default);
    Task<TimetableEntry?> GetByIdAsync(Guid entryId, CancellationToken ct = default);
    Task<bool> DeleteOwnedAsync(Guid entryId, Guid userId, CancellationToken ct = default);
}
