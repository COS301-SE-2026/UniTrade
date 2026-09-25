namespace Modules.Reservations.Availability;

public interface IAvailabilityService
{
    Task<AvailabilityResult> GetAvailabilityAsync(
        Guid reservationId,
        Guid callerId,
        CancellationToken ct = default
    );
}
