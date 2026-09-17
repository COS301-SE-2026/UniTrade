using Modules.Timetable;
using Modules.Timetable.Models;
using Modules.Timetable.Repositories;

namespace Infrastructure.Persistence.Repositories.Timetable;

public sealed class TimetableQueryForAvailability(ITimetableRepository repository)
    : ITimetableQueryForAvailability
{
    public Task<IReadOnlyList<TimetableEntry>> ListForUserAsync(
        Guid userId,
        CancellationToken ct = default
    ) => repository.ListForUserAsync(userId, ct);
}
