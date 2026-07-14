using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Modules.Chat;
using Modules.Chat.Models;
using Modules.Chat.Models.Dto;
using Modules.Reservations;
using Modules.Reservations.Repositories;

namespace Api.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly IReservationRepository _reservation; //add this mdoule.reserv folder+ using

    private readonly IChatService _chatService;

    public ChatHub(IReservationRepository reservations, IChatService chatService)
    {
        _reservation = reservations;
        _chatService = chatService;
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
        if (!Guid.TryParse(userId, out var userGuid))
        {
            throw new HubException("Unauthorised: invalid user identifier");
        }
        var isAuthorised = await _reservation.IsPartyToAsync(
            reservationId,
            userGuid,
            Context.ConnectionAborted
        ); //stub for now, needs tp be from ireservation!!
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

    public async Task<ChatMessageDto> SendMessage(Guid reservationId, string content)
    {
        var userId = GetUserId() ?? throw new HubException("Unauthorised: not a valid user");
        ChatMessageDto message;

        try
        {
            message = await _chatService.SendAsync(reservationId, Guid.Parse(userId), content);
        }
        catch (ChatException ex)
        {
            throw new HubException(
                ex.Message == ChatErrors.Forbidden
                    ? "Forbidden: you are not a participant in this reservation."
                    : ex.Message
            );
        }
        catch (ArgumentException ex)
        {
            throw new HubException(ex.Message);
        }

        await Clients.Group(GroupName(reservationId)).SendAsync("ReceiveMessage", message);
        return message;
    }

    //read receipts -markAsread func
    //automatic messages->test zee's reservationfunc when pr'd
    //braodcast messages to reservation
    public async Task ReadReceipts(Guid reservationId, int upToMessageId)
    {
        var userId = GetUserId() ?? throw new HubException("Unauthorised: not a valid user");

        int counter;

        try
        {
            counter = await _chatService.MarkReadAsync(
                reservationId,
                Guid.Parse(userId),
                upToMessageId
            );
        }
        catch (ChatException ex)
        {
            throw new HubException(
                ex.Message == ChatErrors.Forbidden
                    ? "Forbidden: you are not a participant in this reservation."
                    : ex.Message
            );
        }

        if (counter > 0)
        {
            await Clients
                .OthersInGroup(GroupName(reservationId))
                .SendAsync(
                    "Messages Read",
                    new
                    {
                        reservationId,
                        upToMessageId,
                        readBy = userId,
                    }
                );
        }
    }
}
