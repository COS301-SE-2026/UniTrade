using Microsoft.AspNetCore.SignalR;
using Modules.Reservations;
using Modules.Reservations.Models.Dto;

namespace Api.Hubs;

public class ReservationRealTimeService : IReservationRealTime
{
    private readonly IHubContext<ChatHub> _hubContext;

    public ReservationRealTimeService(IHubContext<ChatHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task ReservationUpdatedAsync(
        ReservationDto reservation,
        CancellationToken ct = default
    )
    {
        await _hubContext
            .Clients.Group($"reservation-{reservation.ReservationId}")
            .SendAsync("ReservationUpdated", reservation, ct);
    }
}
