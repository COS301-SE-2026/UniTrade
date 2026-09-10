using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Modules.Audit.Models;
using Modules.Audit.Repositories;

namespace Infrastructure.Persistence.Repositories.Audit;

public class AuditRepository : IAuditRepository
{
    private readonly AppDbContext _db;

    public AuditRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task AddAsync(AuditLog log, CancellationToken ct = default)
    {
        _db.AuditLogs.Add(log);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<AuditLog>> GetAsync(
        string? id,
        Guid? actorId,
        CancellationToken ct = default
    )
    {
        var query = _db.AuditLogs.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(id))
        {
            query = query.Where(a => a.EntityId == id);
        }

        if (actorId.HasValue)
        {
            query = query.Where(a => a.ActorId == actorId.Value);
        }
        return await query.OrderByDescending(a => a.CreatedAt).ToListAsync(ct);
    }
}
