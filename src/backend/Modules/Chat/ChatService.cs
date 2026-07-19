using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Modules.Chat.Models;
using Modules.Chat.Models.Dto;
using Modules.Chat.Repository;
using Modules.Reservations.Models.Dto;
using Modules.Reservations.Repositories;
using Modules.Reservations.StateMachine;

namespace Modules.Chat;

public class ChatService : IChatService
{
    private readonly IReservationRepository _reservations; //using Isuserpat of reseravtion func
    private readonly IChatRepository _chatRepo;
    private readonly IChatNotifier _notifier;

    public ChatService(
        IChatRepository chatRepo,
        IReservationRepository reservations,
        IChatNotifier notifier
    )
    {
        _chatRepo = chatRepo;
        _reservations = reservations;
        _notifier = notifier;
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

        //block buyer/seller if seller not acked
        var reservation = await _reservations.GetByIdAsync(reservationId, ct);

        if (reservation is not null && reservation.ReservationStatus == ReservationState.Cancelled)
        {
            throw new ChatException(ChatErrors.ReservationCancelled);
        }

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
            _chatRepo.Detach(result);
            var winner = await _chatRepo.GetByClientKeyAsync(reservationId, clientKey!, ct);

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
        var dto = ToDto(result);

        var reservation = await _reservations.GetByIdAsync(reservationId, ct);
        if (reservation is null)
        {
            throw new InvalidOperationException("Reservation not found");
        }
        var recipientIds = new[] { reservation.BuyerId, reservation.SellerId };
        await _notifier.MessageCreatedAsync(dto, recipientIds, ct);
        return dto;
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
            m.ReadAt,
            m.ClientKey
        );
    }

    public Task<IReadOnlyDictionary<Guid, (string Content, DateTime SentAt)>> GetLastMessagesAsync(
        IEnumerable<Guid> reservationIds,
        CancellationToken ct = default
    ) => _chatRepo.GetLastMessagesAsync(reservationIds, ct);

    public async Task<ChatMessageDto> SendMeetupProposalAsync(
        Guid reservationId,
        Guid senderId,
        MeetupProposalPayload payload,
        CancellationToken ct = default
    )
    {
        if (!await _reservations.IsPartyToAsync(reservationId, senderId, ct))
        {
            throw new ChatException(ChatErrors.Forbidden);
        }

        var content =
            $"Proposed a meetup at {payload.LocationName}, "
            + $"{payload.ProposedTime:ddd d MMM HH:mm}";

        var message = new ChatMessage
        {
            ReservationId = reservationId,
            SenderId = senderId,
            MessageType = "meetup_proposal",
            Content = content,
            Payload = JsonSerializer.Serialize(payload),
            SentAt = DateTime.UtcNow,
        };

        await _chatRepo.AddAsync(message, ct);
        await _chatRepo.SaveAsync(ct);
        return ToDto(message);
    }

    public async Task<ChatMessageDto?> GetMessageAsync(
        Guid reservationId,
        int message,
        CancellationToken ct = default
    )
    {
        var m = await _chatRepo.GetByIdAsync(reservationId, message, ct);
        return m is null ? null : ToDto(m);
    }

    public Task<bool> HasResponseForProposalAsync(
        Guid reservationId,
        int proposalMessageId,
        CancellationToken ct = default
    ) => _chatRepo.HasResponseForProposalAsync(reservationId, proposalMessageId, ct);

    public async Task<ChatMessageDto> SendMeetupResponseAsync(
        Guid reservationId,
        Guid senderId,
        MeetupResponsePayload payload,
        CancellationToken ct = default
    )
    {
        if (!await _reservations.IsPartyToAsync(reservationId, senderId, ct))
        {
            throw new ChatException(ChatErrors.Forbidden);
        }

        var content = payload.Accepted
            ? $"Meetup confirmed - {payload.ProposedTime:ddd d MMM HH:mm} at {payload.LocationName}"
            : "Meetup proposal declined";
        var result = new ChatMessage
        {
            ReservationId = reservationId,
            SenderId = senderId,
            MessageType = "meetup_response",
            Content = content,
            Payload = JsonSerializer.Serialize(payload),
            SentAt = DateTime.UtcNow,
        };

        await _chatRepo.AddAsync(result, ct);
        await _chatRepo.SaveAsync(ct);
        return ToDto(result);
    }
}
