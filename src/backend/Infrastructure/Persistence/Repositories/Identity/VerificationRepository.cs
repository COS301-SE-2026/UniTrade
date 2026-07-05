using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Modules.Identity.Models;
using Modules.Identity.Verification;

namespace Modules.Identity.Verification;

public class VerificationRepository : IVerificationRepository
{
    private readonly AppDbContext _db;

    public VerificationRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<VerificationRequest?> GetCurrentByUserIdAsync(Guid userId)
    {
        return await _db.VerificationRequests.FirstOrDefaultAsync(x =>
            x.UserId == userId && x.IsCurrent
        );
    }

    public async Task CreateAsync(VerificationRequest request)
    {
        _db.VerificationRequests.Add(request);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateAsync(VerificationRequest request)
    {
        _db.VerificationRequests.Update(request);
        await _db.SaveChangesAsync();
    }
}
