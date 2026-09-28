using Microsoft.EntityFrameworkCore;
using Modules.Identity.Models;
using Modules.Identity.Repositories;

namespace Infrastructure.Persistence.Repositories;

public class PasswordResetRepository : IPasswordResetRepository
{
    private readonly AppDbContext _db;

    public PasswordResetRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<PasswordResetRequest?> GetCurrentByUserIdAsync(Guid userId)
    {
        return await _db.PasswordResetRequests
            .Where(r => r.UserId == userId && r.IsCurrent)
            .OrderByDescending(r => r.OtpSentAt)
            .FirstOrDefaultAsync();
    }

    public async Task CreateAsync(PasswordResetRequest request)
    {
        _db.PasswordResetRequests.Add(request);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateAsync(PasswordResetRequest request)
    {
        _db.PasswordResetRequests.Update(request);
        await _db.SaveChangesAsync();
    }
}