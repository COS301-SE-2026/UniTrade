using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Modules.Chat;
using Modules.Reservations;

namespace Api.Hubs;

[Authorize]
public class ChatHub : Hubs
{
    private readonly IReservationsRepository _reservation; //add this mdoule.reserv folder+ using

    private ChatHub(IReservationsRepository reservations)
    {
        _reservation = reservations;
    }
}
