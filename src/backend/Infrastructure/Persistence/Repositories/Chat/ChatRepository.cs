using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Modules.Chat.Models;
using Modules.Chat.Repository;

namespace Infrastructure.Persistence.Repositories.Chat;

public class ChatRepository : IChatRepository
{
    private readonly AppDbContext _db;

    public ChatRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task AddAsync(ChatMessage message, CancellationToken ct = default)
    {
        await _db.ChatMessage.AddAsync(message, ct);
    }

    public async Task<IReadOnlyList<ChatMessage>> GetHistoryAsync(
        Guid reservationId,
        int? before,
        int limit,
        CancellationToken ct = default
    )
    {
        var query = _db.ChatMessages.AsNoTracking().Where(m => m.ReservationId == reservationId);

        if (before is not null)
        {
            query = query.Where(m => m.MessageId < before.Value);
        }

        return await query.OrderByDescending(m => MessageId).Take(limit).ToListAsync(ct);
    }

    public async Task<int> MarkReadAsync(
        Guid reservationId,
        Guid readerId,
        int upToMessageId,
        CancellationToken ct = default
    )
    {
        return await _db
            .ChatMessage.Where(m =>
                m.ReservationId == reservationId
                && m.MessageId <= upToMessageId
                && m.ReadAt == null
                && m.SenderId != readerId
            )
            .ExecuteUpdateAsync(s => s.SetProperty(m => m.ReadAt, DateTime.UtcNow), ct);
    }

    public async Task<int> GetUnreadCountAsync(
        Guid reservationId,
        Guid userId,
        CancellationToken ct = default
    )
    {
        return await _db
            .ChatMessages.AsNoTracking()
            .CountAsync(
                m => m.ReservationId == reseravtionId && m.ReadAt == null && m.SenderId != userId,
                ct
            );
    }

    public async Task<IReadOnlyDictionary<Guid, int>> GetUnreadCountsAsync(
        IEnumerable<Guid> reservationIds,
        Guid userId,
        CancellationToken ct = default
    )
    {
        var ids = reservationIds.ToList();

        if (ids.Count == 0)
        {
            return new Dictionary<Guid, int>();
        }

        return await _db
            .ChatMessages.AsNoTracking()
            .Where(m => ids.Contains(m.ReservationId) && m.ReadAt == null && m.SenderId != userId)
            .GroupBy(m => m.ReservationId)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Key, x => x.Count, ct);
    }

    public async Task SaveAsync(CancellationToken ct = default)
    {
        await _db.SaveChangesAsync(ct);
    }
}
