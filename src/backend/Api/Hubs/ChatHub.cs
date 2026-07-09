using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Modules.Chat;
using Modules.Reservations;
using Modules.Reservations.Repositories;

namespace Api.Hubs;

[Authorize]
public class ChatHub : Hubs
{
    private readonly IReservationsRepository _reservation; //add this mdoule.reserv folder+ using

    private ChatHub(IReservationsRepository reservations)
    {
        _reservation = reservations;
    }

    //standard func acc to signalR rules
    public override Task OnConnectedAsync()
    {
        if(string.IsNullOrEmpty(GetUserId()))
        {
            //abort
        }

        return base.OnConnectedAsync();
    }

    //joining of reservation rooms 
    public async JoinRoom(Guid reservationId)
    {
        var userId=GetUserId() ?? throw new HubException("Unauthorised: not a valid user");

        var isAuthorised=await _reservation.IsUserReservedAsync(userId,reservationId);//stub for now!!
        if(!isAuthorised)
        {
            throw new HubException("Forbidden: you are not a participant in this reservation.");
        }

        await.Groups.AddToGroupAsync(Context.ConnectionId,GroupName(reservationId));
        await.Client.Caller.SendAsync("Joined room", reservationId);
    }

    public string? GetUserId()
    {
    
    }
    
    //signalR mechanism of referencing a user to the same room
    private static string GroupName(Guid reservationId)
    {
        return $"reservation-{reservationId}";
    }
}
