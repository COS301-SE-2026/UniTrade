namespace Modules.Timetable;

public interface ITimetableNotifier
{
    Task TimetableUpdatedAsync(Guid userId, CancellationToken ct = default);
}
