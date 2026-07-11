using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Modules.Reservations;
using Modules.Reservations.Repositories;

namespace Api.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly IReservationRepository _reservation; //add this mdoule.reserv folder+ using

    public ChatHub(IReservationRepository reservations)
    {
        _reservation = reservations;
    }

    //standard func acc to signalR rules
    public override Task OnConnectedAsync()
    {
        if (string.IsNullOrEmpty(GetUserId()))
        {
            Context.Abort();
        }

        return base.OnConnectedAsync();
    }

    //joining of reservation rooms
    public async Task JoinRoom(Guid reservationId)
    {
        var userId = GetUserId() ?? throw new HubException("Unauthorised: not a valid user");
        if(!Guid.TryParse(userId, out var userGuid))
        {
            throw new HubException("Unauthorised: invalid user identifier");
        }
        var isAuthorised = await _reservation.IsPartyToAsync(reservationId, userGuid, Context.ConnectionAborted); //stub for now, needs tp be from ireservation!!
        if (!isAuthorised)
        {
            throw new HubException("Forbidden: you are not a participant in this reservation.");
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(reservationId));
        await Clients.Caller.SendAsync("Joined room", reservationId);
    }

    public string? GetUserId()
    {
        return Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? Context.User?.FindFirst("sub")?.Value;
    }

    //signalR mechanism of referencing a user to the same room
    private static string GroupName(Guid reservationId)
    {
        return $"reservation-{reservationId}";
    }
}
