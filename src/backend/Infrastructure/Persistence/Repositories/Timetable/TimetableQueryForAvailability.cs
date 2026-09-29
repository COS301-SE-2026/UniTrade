using Modules.Timetable;
using Modules.Timetable.Models;
using Modules.Timetable.Repositories;

namespace Infrastructure.Persistence.Repositories.Timetable;

public sealed class TimetableQueryForAvailability(ITimetableRepository repository)
    : ITimetableQueryForAvailability
{
    public Task<IReadOnlyList<TimetableEntry>> ListForUserAsync(
        Guid UserId,
        CancellationToken ct = default
    ) => repository.ListForUserAsync(UserId, ct);
}
