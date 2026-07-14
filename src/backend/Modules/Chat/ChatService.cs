using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Modules.Chat.Models;
using Modules.Chat.Models.Dto;
using Modules.Chat.Repository;
using Modules.Reservations;
using Modules.Reservations.Repositories;

namespace Modules.Chat;

public class ChatService : IChatService
{
    private readonly IReservationRepository _reservations; //using Isuserpat of reseravtion func
    private readonly IChatRepository _chatRepo;

    public ChatService(IChatRepository chatRepo, IReservationRepository reservations)
    {
        _chatRepo = chatRepo;
        _reservations = reservations;
    }

    public async Task<ChatMessageDto> SendAsync(
        Guid reservationId,
        Guid senderId,
        string content,
        string? clientKey = null,
        CancellationToken ct = default
    )
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            throw new ArgumentException("Message content cannot be empty");
        }

        var isAuthorised = await _reservations.IsPartyToAsync(reservationId, senderId, ct);

        if (!isAuthorised)
        {
            throw new ChatException(ChatErrors.Forbidden); // i change dit because of sonarqube
        }

        if (!string.IsNullOrWhiteSpace(clientKey))
        {
            var existing = await _chatRepo.GetByClientKeyAsync(reservationId, clientKey, ct);

            if (existing is not null && existing.SenderId == senderId)
            {
                return ToDto(existing);
            }
        }

        var reservation = await _reservations.GetByIdAsync(reservationId, ct);

        if (
            reservation is not null
            && reservation.BuyerId == senderId
            && reservation.SellerAcknowledgedAt is null
        )
        {
            throw new ChatException(ChatErrors.BuyerWaitingAck);
        }

        var result = new ChatMessage
        {
            ReservationId = reservationId,
            SenderId = senderId,
            MessageType = "text",
            Content = content,
            ClientKey = string.IsNullOrWhiteSpace(clientKey) ? null : clientKey,
            SentAt = DateTime.UtcNow,
        };

        try
        {
            await _chatRepo.AddAsync(result);
            await _chatRepo.SaveAsync(ct);
        }
        catch (DbUpdateException ex)
            when (ex.InnerException is Npgsql.PostgresException pg
                && pg.SqlState == "23505"
                && pg.ConstraintName == "uix_chat_client_key"
            )
        {
            var winner = await _chatRepo.GetByClientKeyAsync(reservationId, clientKey, ct);

            if (winner is not null && winner.SenderId == senderId)
            {
                return ToDto(winner);
            }
            throw;
        }
        return ToDto(result);
    }

    public async Task<ChatMessageDto> SendSystemAsync(
        Guid reservationId,
        string content,
        CancellationToken ct = default
    )
    {
        var result = new ChatMessage
        {
            ReservationId = reservationId,
            SenderId = null, // nulled because system messages don't technically have a sender
            MessageType = "system",
            Content = content,
            SentAt = DateTime.UtcNow,
        };
        await _chatRepo.AddAsync(result);
        await _chatRepo.SaveAsync(ct);
        return ToDto(result);
    }

    public async Task<ChatHistoryDto> GetHistoryAsync(
        Guid reservationId,
        Guid callerId,
        int? before,
        int limit = 50,
        CancellationToken ct = default
    )
    {
        var isAuthorised = await _reservations.IsPartyToAsync(reservationId, callerId, ct);

        if (!isAuthorised)
        {
            throw new ChatException(ChatErrors.Forbidden);
        }

        //create repo func for this
        // var query=_chatRepo.ChatMessages.Where()

        var rows = await _chatRepo.GetHistoryAsync(reservationId, before, limit + 1, ct); // to check whether theres oldies remaining

        var hasMore = rows.Count > limit;

        var messages = rows.Take(limit).Select(ToDto).Reverse().ToList();
        return new ChatHistoryDto(messages, hasMore);
    }

    public async Task<int> MarkReadAsync(
        Guid reservationId,
        Guid readerId,
        int upToMessageId,
        CancellationToken ct = default
    )
    {
        var isAuthorised = await _reservations.IsPartyToAsync(reservationId, readerId, ct);

        if (!isAuthorised)
        {
            throw new ChatException(ChatErrors.Forbidden);
        }
        return await _chatRepo.MarkReadAsync(reservationId, readerId, upToMessageId);
    }

    public Task<int> GetUnreadCountAsync(
        Guid reservationId,
        Guid userId,
        CancellationToken ct = default
    ) => _chatRepo.GetUnreadCountAsync(reservationId, userId, ct);

    public Task<IReadOnlyDictionary<Guid, int>> GetUnreadCountsAsync(
        IEnumerable<Guid> reservationIds,
        Guid userId,
        CancellationToken ct = default
    ) => _chatRepo.GetUnreadCountsAsync(reservationIds, userId, ct);

    private static ChatMessageDto ToDto(ChatMessage m)
    {
        JsonElement? payload = m.Payload is not null
            ? JsonDocument.Parse(m.Payload).RootElement
            : null;

        return new ChatMessageDto(
            m.MessageId,
            m.ReservationId,
            m.SenderId,
            m.MessageType,
            m.Content,
            payload,
            m.SentAt,
            m.ReadAt
        );
    }

    public Task<IReadOnlyDictionary<Guid, (string Content, DateTime SentAt)>> GetLastMessagesAsync(
        IEnumerable<Guid> reservationIds,
        CancellationToken ct = default
    ) => _chatRepo.GetLastMessagesAsync(reservationIds, ct);
}
