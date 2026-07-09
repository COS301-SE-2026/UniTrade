using Modules.Chat.Models;
using Modules.Reservations.Models.Dto;

namespace Modules.Chat;

public interface IChatService
{
    Task<ChatMessageDto> SendAsync(
        Guid reservationId,
        Guid senderId,
        string content,
        CancellationToken ct = default
    );

    Task<ChatMessageDto> SendSystemAsync(
        Guid reservationId,
        string content,
        CancellationToken ct = default
    );
    Task<ChatMessageDto> GetHistoryAsync(
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
}
