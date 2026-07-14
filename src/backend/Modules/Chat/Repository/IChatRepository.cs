using Modules.Chat.Models;

namespace Modules.Chat.Repository;

public interface IChatRepository
{
    Task AddAsync(ChatMessage message, CancellationToken ct = default);
    Task<IReadOnlyList<ChatMessage>> GetHistoryAsync(
        Guid reservationId,
        int? before,
        int limit,
        CancellationToken ct = default
    );
    Task<int> MarkReadAsync(
        Guid reservationId,
        Guid readerId,
        int upToMessageId,
        CancellationToken ct = default
    );

    //single reservation
    Task<int> GetUnreadCountAsync(Guid reservationId, Guid userId, CancellationToken ct = default);

    //batch
    Task<IReadOnlyDictionary<Guid, int>> GetUnreadCountsAsync(
        IEnumerable<Guid> reservationIds,
        Guid userId,
        CancellationToken ct = default
    );
    Task SaveAsync(CancellationToken ct = default);

    Task<IReadOnlyDictionary<Guid, (string Content, DateTime SentAt)>> GetLastMessagesAsync(
        IEnumerable<Guid> reservationIds,
        CancellationToken ct = default
    );

    Task<ChatMessage?> GetByClientKeyAsync(
        Guid reservationId,
        string clientKey,
        CancellationToken ct = default
    );
}
