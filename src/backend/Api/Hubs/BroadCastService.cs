using Modules.Reservations;
using Microsoft.AspNetCore.SignalR;

namespace Api.Hubs;

public class BroadCastService: IBroadCastService
{
    private readonly IHubContext<ChatHub> _hubcontext;

    public BroadCastService(IHubContext<ChatHub> hubcontext)
    {
        _hubcontext=hubcontext;
    }

    public async Task BroadCastStatusChange(Guid reservationId, string newStatus)
    {
        await _hubcontext.Clients.Group($"reservation-{reservationId}").SendAsync("ReservationStatusChanged",new{reservationId, status=newStatus});
    }

}