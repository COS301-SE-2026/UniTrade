using Api.Hubs;
using Microsoft.AspNetCore.SignalR;
using Modules.Reservations;

namespace Api.Notifiers;

public class BroadCastService : IBroadCastService
{
    private readonly IHubContext<ChatHub> _hubcontext;

    public BroadCastService(IHubContext<ChatHub> hubcontext)
    {
        _hubcontext = hubcontext;
    }

    public async Task BroadCastStatusChange(Guid reservationId, string newStatus)
    {
        await _hubcontext
            .Clients.Group($"reservation-{reservationId}")
            .SendAsync("ReservationStatusChanged", new { reservationId, status = newStatus });
    }

    public async Task SendToUserAsync(Guid userId, string eventName, object payload)
    {
        await _hubcontext.Clients.User(userId.ToString()).SendAsync(eventName, payload);
    }

    public async Task NotifyAdminAsync(string eventName, object payload)
    {
        await _hubcontext.Clients.Group("Admins").SendAsync(eventName, payload);
    }
}
