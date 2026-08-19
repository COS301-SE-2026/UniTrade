using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Modules.Chat.Models;
using Modules.Chat.Models.Dto;
using Modules.Chat.Repository;
using Modules.Notifications;
using Modules.SharedKernel;

namespace Modules.Chat;

public class ChatService : IChatService
{
    private readonly IReservationMembership _membership;
    private readonly IChatRepository _chatRepo;
    private readonly IChatNotifier _notifier;
    private readonly INotificationDispatcher _pushNotifier;
    private readonly ILogger<ChatService> _logger;

    private static readonly TimeSpan _southAfricaOffset = TimeSpan.FromHours(2);

    private static DateTime ToSouthAfricaTime(DateTime utc) =>
        DateTime.SpecifyKind(utc, DateTimeKind.Utc).Add(_southAfricaOffset);

    public ChatService(
        IChatRepository chatRepo,
        IReservationMembership membership,
        IChatNotifier notifier,
        INotificationDispatcher pushNotifier,
        ILogger<ChatService> logger
    )
    {
        _chatRepo = chatRepo;
        _membership = membership;
        _notifier = notifier;
        _pushNotifier = pushNotifier;
        _logger = logger;
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

        var isAuthorised = await _membership.IsPartyToAsync(reservationId, senderId, ct);

        if (!isAuthorised)
        {
            throw new ChatException(ChatErrors.Forbidden); // i changes it  because of sonarqube
        }

        if (!string.IsNullOrWhiteSpace(clientKey))
        {
            var existing = await _chatRepo.GetByClientKeyAsync(reservationId, clientKey, ct);

            if (existing is not null && existing.SenderId == senderId)
            {
                return ToDto(existing);
            }
        }

        var status = await _membership.CheckMessagingAllowedAsync(reservationId, senderId, ct);
        switch (status)
        {
            case ReservationStatusMessage.ReservationCancelled:
                throw new ChatException(ChatErrors.ReservationCancelled);

            case ReservationStatusMessage.BuyerWaitingForSellerAck:
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
            await _chatRepo.AddAsync(result, ct);
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

        var dto = ToDto(result);
        await NotifyRecipientAsync(reservationId, senderId, content, ct);
        return dto;
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
        await _chatRepo.AddAsync(result, ct);
        await _chatRepo.SaveAsync(ct);

        var dto = ToDto(result);

        try
        {
            var parties = await _membership.GetReservationPartiesAsync(reservationId, ct);
            var receivingPartyIds = new[] { parties.BuyerId, parties.SellerId };
            await _notifier.MessageCreatedAsync(dto, receivingPartyIds, ct);
        }
        catch (Exception e)
        {
            _logger.LogError(
                e,
                "Failed to broadcast system message for reservation {ReservationId}",
                reservationId
            );
        }

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
        var isAuthorised = await _membership.IsPartyToAsync(reservationId, callerId, ct);

        if (!isAuthorised)
        {
            throw new ChatException(ChatErrors.Forbidden);
        }

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
        var isAuthorised = await _membership.IsPartyToAsync(reservationId, readerId, ct);

        if (!isAuthorised)
        {
            throw new ChatException(ChatErrors.Forbidden);
        }
        return await _chatRepo.MarkReadAsync(reservationId, readerId, upToMessageId, ct);
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
        if (!await _membership.IsPartyToAsync(reservationId, senderId, ct))
        {
            throw new ChatException(ChatErrors.Forbidden);
        }

        var content =
            $"Proposed a meetup at {payload.LocationName}, "
            + $"{ToSouthAfricaTime(payload.ProposedTime):ddd d MMM HH:mm}";

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

        var dto = ToDto(message);

        try
        {
            var parties = await _membership.GetReservationPartiesAsync(reservationId, ct);
            var receivingPartyIds = new[] { parties.BuyerId, parties.SellerId };
            await _notifier.MessageCreatedAsync(dto, receivingPartyIds, ct);
        }
        catch (Exception e)
        {
            _logger.LogError(
                e,
                "Failed to broadcast meetup proposal for reservation {ReservationId}",
                reservationId
            );
        }

        return dto;
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
        if (!await _membership.IsPartyToAsync(reservationId, senderId, ct))
        {
            throw new ChatException(ChatErrors.Forbidden);
        }

        string content;
        if (payload.Accepted)
        {
            var timeText = payload.ProposedTime.HasValue
                ? ToSouthAfricaTime(payload.ProposedTime.Value).ToString("ddd d MMM HH:mm")
                : "time TBC";
            content = $"Meetup confirmed - {timeText} at {payload.LocationName}";
        }
        else
        {
            content = "Meetup proposal declined";
        }
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
        var dto = ToDto(result);

        try
        {
            var parties = await _membership.GetReservationPartiesAsync(reservationId, ct);
            var receivingPartyIds = new[] { parties.BuyerId, parties.SellerId };
            await _notifier.MessageCreatedAsync(dto, receivingPartyIds, ct);
        }
        catch (Exception e)
        {
            _logger.LogError(
                e,
                "Failed to broadcast meetup response for reservation {ReservationId}",
                reservationId
            );
        }

        return dto;
    }

    private async Task NotifyRecipientAsync(
        Guid reservationId,
        Guid senderId,
        string content,
        CancellationToken ct
    )
    {
        try
        {
            var parties = await _membership.GetReservationPartiesAsync(reservationId, ct);
            var receivingPartyId = parties.BuyerId == senderId ? parties.SellerId : parties.BuyerId;
            var preview = content.Length > 100 ? content[..100] + "..." : content;
            await _pushNotifier.NotifyAsync(receivingPartyId, NotificationTypes.Chat, preview, ct);
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Chat push failed for reservation: {ReservationId}", reservationId);
        }
    }
}
