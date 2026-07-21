using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Modules.Notifications.Models;
using Modules.Notifications.Repositories;

namespace Infrastructure.Notifications;

public class DeviceTokenRepository : IDeviceTokenRepository
{
    private readonly AppDbContext _db;

    public DeviceTokenRepository(AppDbContext db) => _db = db;

    public async Task UpsertAsync(
        Guid userId,
        string token,
        string platform,
        CancellationToken ct = default
    )
    {
        var existingT = await _db.DeviceTokens.FirstOrDefaultAsync(t => t.Token == token, ct);

        if (existingT is not null)
        {
            existingT.LastSeenAt = DateTime.Now;
            existingT.UserId = userId;
        }
        else
        {
            await _db.DeviceTokens.AddAsync(
                new DeviceToken
                {
                    UserId = userId,
                    Token = token,
                    Platform = platform,
                    CreatedAt = DateTime.UtcNow,
                    LastSeenAt = DateTime.UtcNow,
                },
                ct
            );
        }
        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex)
        {
            throw;
        }
    }

    public async Task<IReadOnlyList<string>> GetTokensForUserAsync(
        Guid userId,
        CancellationToken ct = default
    ) => await _db.DeviceTokens.Where(t => t.UserId == userId).Select(t => t.Token).ToListAsync(ct);

    public async Task DeleteAsync(IEnumerable<string> tokens, CancellationToken ct = default)
    {
        var tokenList = tokens.ToList();
        if (tokenList.Count == 0)
        {
            return;
        }
        await _db.DeviceTokens.Where(t => tokenList.Contains(t.Token)).ExecuteDeleteAsync(ct);
    }
}
