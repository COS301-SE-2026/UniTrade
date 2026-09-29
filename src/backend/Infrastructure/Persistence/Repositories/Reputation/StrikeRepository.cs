using Microsoft.EntityFrameworkCore;
using Modules.Reputation.Models;
using Modules.Reputation.Repositories;

namespace Infrastructure.Persistence.Repositories.Reputation;

public class StrikeRepository : IStrikeRepository
{
    // strike types that count towards a ban - excl refusal flag
    private static readonly string[] _bannableTypes = { "strike", "manual" };
    private readonly AppDbContext _db;

    public StrikeRepository(AppDbContext db) => _db = db;

    public async Task AddAsync(Strike strike, CancellationToken ct = default)
    {
        _db.Strikes.Add(strike);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<Strike>> ListForUserAsync(
        Guid userId,
        CancellationToken ct = default
    ) =>
        await _db
            .Strikes.AsNoTracking()
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(ct);

    public async Task<int> CountForUserAsync(Guid userId, CancellationToken ct = default) =>
        await _db.Strikes.AsNoTracking().CountAsync(s => s.UserId == userId, ct);

    public async Task<int> CountBannableForUserByScopeAsync(Guid userId, string scope, CancellationToken ct = default) =>
        await _db.Strikes.AsNoTracking().CountAsync(s => s.UserId == userId && s.Scope == scope && _bannableTypes.Contains(s.Type), ct);
}
