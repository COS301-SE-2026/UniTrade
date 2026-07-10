using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Modules.Chat.Models;
using Modules.Chat.Models.Dto;
using Modules.Reservations;

namespace Modules.Chat;

public class ChatService: IChatService
{
    private readonly IReservationService _reservationService;//using Isuserpat of reseravtion func
    private readonly AppDbContext _context; ///swap out for repo

    public ChatService(AppDbContext context, IReservationService reservationSerice)
    {
        _context=context;
        _reservationService=reservationSerice;
    }

    public async Task<ChatMessageDto> SendAsync(Guid reservationId, Guid senderId,string content, CancellationToken ct=default)
    {
        if(string.IsNullOrWhiteSpace(content))
        {
            throw ne ArgumentException("Message content cannot be empty");
        }

        var isAuthorised= await _reservationService.IsUserReservedAsync(senderId,reservationId);

        if(!isAuthorised)
        {
            throw new UnauthorisedAccessException("You are not a participant of this reservation");
        }

        var result=new ChatMessageDto{
            ReservationId=reservationId,
            SenderId=senderId,
            MessageType="text",
            Content=content,
            SentAt=DateTime.UtcNow
        };

        _context.ChatMessages.Add(result);

        await _context.SaveChanges.Async(ct);

        return ToDoto(result);
    }
}