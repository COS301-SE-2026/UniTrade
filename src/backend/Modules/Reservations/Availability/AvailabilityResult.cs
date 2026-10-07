namespace Modules.Reservations.Availability;

public abstract record AvailabilityResult
{
    private AvailabilityResult() { }

    public sealed record Ok(IReadOnlyList<AvailabilityWindow> Slots) : AvailabilityResult;

    public sealed record NoOverlap : AvailabilityResult;

    public sealed record MissingTimetable(string Party) : AvailabilityResult;
}
