using Infrastructure.Realtime;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Modules.Chat;
using Modules.Chat.Models.Dto;
using Modules.Reservations.Repositories;

namespace Api.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly IReservationRepository _reservation; //add this mdoule.reserv folder+ using
    private readonly ConnectionTracker _tracker;
    private readonly IChatService _chatService;

    public ChatHub(
        IReservationRepository reservations,
        IChatService chatService,
        ConnectionTracker tracker
    )
    {
        _reservation = reservations;
        _chatService = chatService;
        _tracker = tracker;
    }

    //standard func acc to signalR rules
    public override Task OnConnectedAsync()
    {
        var userId = GetUserId() ?? throw new HubException("Unauthorised");
        if (!Guid.TryParse(userId, out var userGuid))
        {
            throw new HubException("Invalid user identifier");
        }
        if (string.IsNullOrEmpty(GetUserId()))
        {
            Context.Abort();
        }
        _tracker.Add(userGuid, Context.ConnectionId);

        return base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId() ?? throw new HubException("Unauthorised");
        if (!Guid.TryParse(userId, out var userGuid))
        {
            throw new HubException("Invalid user identifier");
        }

        _tracker.Remove(userGuid, Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
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

    public async Task<ChatMessageDto> SendMessage(
        Guid reservationId,
        string content,
        string? clientKey = null
    )
    {
        // await Task.Delay(12000); // just using this for testing locally
        var userId = GetUserId() ?? throw new HubException("Unauthorised: not a valid user");
        ChatMessageDto message;
        if (!Guid.TryParse(userId, out var senderId))
        {
            throw new HubException("Unauthorised: invalid user identifier");
        }

        try
        {
            message = await _chatService.SendAsync(reservationId, senderId, content, clientKey);
        }
        catch (ChatException ex)
        {
            throw new HubException(
                ex.Message == ChatErrors.Forbidden ? "You are not a participant in this reservation"
                : ex.Message == ChatErrors.BuyerWaitingAck ? "Seller needs to acknowledge you first"
                : ex.Message == ChatErrors.ReservationCancelled ? "Reservation was Cancelled"
                : ex.Message
            );
        }
        catch (ArgumentException ex)
        {
            throw new HubException(ex.Message);
        }

        var reservation = await _reservation.GetByIdAsync(reservationId, Context.ConnectionAborted);
        if (reservation is not null)
        {
            var recipientId =
                reservation.BuyerId == senderId ? reservation.SellerId : reservation.BuyerId;
            await Clients.User(recipientId.ToString()).SendAsync("ReceiveMessage", message);
        }

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
            var reservation = await _reservation.GetByIdAsync(
                reservationId,
                Context.ConnectionAborted
            );
            if (reservation is not null)
            {
                var senderId = Guid.Parse(userId);

                var recipientId =
                    reservation.BuyerId == senderId ? reservation.SellerId : reservation.BuyerId;
                await Clients
                    .User(recipientId.ToString())
                    .SendAsync(
                        "MessagesRead",
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

    public Task LeaveRoom(Guid reservationId) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(reservationId));

    public async Task JoinAdminGroup()
    {
        var userId = GetUserId();
        if (userId is null)
        {
            throw new HubException("Unauthorized");
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, "Admins");
        await Clients.Caller.SendAsync("JoinedAdminGroup");
    }

    public async Task LeaveAdminGroup()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "Admins");
    }
}
