using Modules.Reservations.Models.Dto;

namespace Modules.Reservations;

public interface IReservationRealTime
{
    Task ReservationUpdatedAsync(ReservationDto reservation, CancellationToken ct = default);
}
