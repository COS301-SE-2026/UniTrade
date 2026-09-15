using Microsoft.EntityFrameworkCore;
using Modules.Reputation.Models;
using Modules.Reputation.Repositories;

namespace Infrastructure.Persistence.Repositories.Reputation;

public class StrikeRepository : IStrikeRepository
{
    private readonly AppDbContext _db;

    public StrikeRepository(AppDbContext db) => _db = db;

    public async Task AddAsync(Strike strike, CancellationToken ct = default)
    {
        _db.Strikes.Add(strike);
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
}
