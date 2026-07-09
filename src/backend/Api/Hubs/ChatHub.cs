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
    public async JoinReservationRm(Guid reservationId)
    {
        
    }
}
