using Modules.Chat.Models.Dto;
using Modules.Reservations.Models.Dto;

namespace Modules.Chat;

public interface IChatService
{
    Task<ChatMessageDto> SendAsync(
        Guid reservationId,
        Guid senderId,
        string content,
        string? clientKey = null,
        CancellationToken ct = default
    );

    Task<ChatMessageDto> SendSystemAsync(
        Guid reservationId,
        string content,
        CancellationToken ct = default
    );
    Task<ChatHistoryDto> GetHistoryAsync(
        Guid reservationId,
        Guid callerId,
        int? before,
        int limit = 50,
        CancellationToken ct = default
    );

    Task<int> MarkReadAsync(
        Guid reservationId,
        Guid readerId,
        int upToMessageId,
        CancellationToken ct = default
    );
    Task<int> GetUnreadCountAsync(Guid reservationId, Guid userId, CancellationToken ct = default);

    Task<IReadOnlyDictionary<Guid, int>> GetUnreadCountsAsync(
        IEnumerable<Guid> reservationIds,
        Guid userId,
        CancellationToken ct = default
    );

    Task<IReadOnlyDictionary<Guid, (string Content, DateTime SentAt)>> GetLastMessagesAsync(
        IEnumerable<Guid> reservationIds,
        CancellationToken ct = default
    );

    Task<ChatMessageDto> SendMeetupProposalAsync(
        Guid reservationId,
        Guid senderId,
        MeetupProposalPayload payload,
        CancellationToken ct = default
    );

    Task<ChatMessageDto?> GetMessageAsync(
        Guid reservationId,
        int message,
        CancellationToken ct = default
    );

    Task<bool> HasResponseForProposalAsync(
        Guid reservationId,
        int proposalMessageId,
        CancellationToken ct = default
    );

    Task<ChatMessageDto> SendMeetupResponseAsync(
        Guid reservationId,
        Guid senderId,
        MeetupResponsePayload payload,
        CancellationToken ct = default
    );
}
