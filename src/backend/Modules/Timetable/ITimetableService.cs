using Modules.Timetable.Models.Dto;

namespace Modules.Timetable;

public interface ITimetableService
{
    Task<IReadOnlyList<TimetableEntryDto>> ListMineAsync(
        Guid userId,
        CancellationToken ct = default
    );

    Task<TimetableEntryDto> AddAsync(
        Guid userId,
        CreateTimetableEntryDto dto,
        CancellationToken ct = default
    );

    Task DeleteAsync(Guid userId, Guid entryId, CancellationToken ct = default);
}
