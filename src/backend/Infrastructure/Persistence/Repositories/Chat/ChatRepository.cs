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
        await _db.ChatMessages.AddAsync(message, ct);
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

        return await query.OrderByDescending(m => m.MessageId).Take(limit).ToListAsync(ct);
    }

    public async Task<int> MarkReadAsync(
        Guid reservationId,
        Guid readerId,
        int upToMessageId,
        CancellationToken ct = default
    )
    {
        return await _db
            .ChatMessages.Where(m =>
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
                m => m.ReservationId == reservationId && m.ReadAt == null && m.SenderId != userId,
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

    public async Task<
        IReadOnlyDictionary<Guid, (string Content, DateTime SentAt)>
    > GetLastMessagesAsync(IEnumerable<Guid> reservationIds, CancellationToken ct = default)
    {
        var ids = reservationIds.ToList();
        if (ids.Count == 0)
        {
            return new Dictionary<Guid, (string, DateTime)>();
        }

        var latest = await _db
            .ChatMessages.AsNoTracking()
            .Where(m => ids.Contains(m.ReservationId))
            .GroupBy(m => m.ReservationId)
            .Select(g => g.OrderByDescending(m => m.MessageId).First())
            .ToListAsync(ct);

        return latest.ToDictionary(m => m.ReservationId, m => (m.Content, m.SentAt));
    }

    public async Task<ChatMessage?> GetByClientKeyAsync(
        Guid reservationId,
        string clientKey,
        CancellationToken ct = default
    )
    {
        return await _db
            .ChatMessages.AsNoTracking()
            .FirstOrDefaultAsync(
                m => m.ReservationId == reservationId && m.ClientKey == clientKey,
                ct
            );
    }

    public void Detach(ChatMessage message)
    {
        _db.Entry(message).State = EntityState.Detached;
    }

    public async Task<ChatMessage?> GetByIdAsync(
        Guid reservationId,
        int messageId,
        CancellationToken ct = default
    )
    {
        return await _db
            .ChatMessages.AsNoTracking()
            .FirstOrDefaultAsync(
                m => m.ReservationId == reservationId && m.MessageId == messageId,
                ct
            );
    }

    public async Task<bool> HasResponseForProposalAsync(
        Guid reservationId,
        int proposalMessageId,
        CancellationToken ct = default
    ) 
    {
        var responses = await _db.ChatMessages
        .AsNoTracking()
        .Where(m =>
        m.ReservationId == reservationId &&
        m.MessageType == "meetup_response")
        .ToListAsync(ct);

        foreach (var message in responses)
    {
        if (string.IsNullOrWhiteSpace(message.Payload))
            continue;

        using var json = System.Text.Json.JsonDocument.Parse(message.Payload);

        if (json.RootElement.TryGetProperty("ProposalMessageId", out var id) &&
            id.GetInt32() == proposalMessageId)
        {
            return true;
        }
    }

    return false;
   /* }=>
        _db.ChatMessages.AnyAsync(
            m =>
                m.ReservationId == reservationId
                && m.MessageType == "meetup_response"
                && EF.Functions.JsonExists(m.Payload!, "ProposalMessageId")
                && m.Payload!.Contains($"\"ProposalMessageId\":{proposalMessageId}"),
            ct
        );
        */
}
}
