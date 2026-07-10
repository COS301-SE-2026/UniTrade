using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Modules.Chat.Models;
using Modules.Chat.Models.Dto;
using Modules.Chat.Models.Repository;
using Modules.Reservations;

namespace Modules.Chat;

public class ChatService: IChatService
{
    private readonly IReservationService _reservationService;//using Isuserpat of reseravtion func
    private readonly IChatRepository _chatRepo; 
    public ChatService(IChatRepository chatRepo, IReservationService reservationSerice)
    {
        _chatRepo=chatRepo;
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

        var result=new ChatMessage{
            ReservationId=reservationId,
            SenderId=senderId,
            MessageType="text",
            Content=content,
            SentAt=DateTime.UtcNow
        };

        await _chatRepo.AddSync(result);

        return ToDoto(result);
    }

    public async Task<ChatMessageDto> SendSystemAsync( Guid reservationId,string content,CancellationToken ct = default)
    {
        var result=new ChatMessage
        {
            ReservationId=reservationId,
            SenderId=senderId,
            MessageType="system",
            Content=content,
            SentAt=DateTime.UtcNow
        }
        await _chatRepo.AddSync(result);

        return ToDoto(result);
    }

    public async Task<ChatHistoryDto> GetHistoryAsync(Guid reservationId,Guid callerId,int? before,int limit = 50,CancellationToken ct = default)
    {
        var isAuthorised= await _reservationService.IsUserReservedAsync(senderId,reservationId);

        if(!isAuthorised)
        {
            throw new UnauthorisedAccessException("You are not a participant of this reservation");
        }

        //create repo func for this
        // var query=_chatRepo.ChatMessages.Where()
    }

    private static ChatMessageDto ToDto(ChatMessage m)
    {
        JsonElement? payload=m.Payload is not null ? JsonDocument.Parse(m.Payload).RootElement:null;

        return new ChatMessageDto(m.MessageId,m.ReservationId,m.SenderId,m.MessageType,m.Content,payload,m.SentAt,m.ReadAt);
    }
}