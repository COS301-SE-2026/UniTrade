using Modules.Timetable.Models;

namespace Modules.Timetable;

public interface ITimetableQueryForAvailability
{
    Task<IReadOnlyList<TimetableEntry>> ListForUserAsync(
        Guid UserId,
        CancellationToken ct = default
    );
}
