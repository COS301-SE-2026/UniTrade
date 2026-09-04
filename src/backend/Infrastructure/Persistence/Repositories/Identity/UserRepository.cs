using Microsoft.EntityFrameworkCore;
using Modules.Identity;
using Modules.Identity.Models;
using Modules.Identity.Repositories;
using Modules.ReferenceData.University;

namespace Infrastructure.Persistence.Repositories;

public sealed class PersistenceException(string code) : Exception(code) { }

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _db;

    public UserRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _db
            .Users.Include(u => u.StudentProfile)
            .FirstOrDefaultAsync(x => x.Email == email);
    }

    public async Task<User?> GetByIdAsync(Guid userId)
    {
        return await _db
            .Users.Include(u => u.StudentProfile)
                .ThenInclude(s => s != null ? s.University : null)
            .FirstOrDefaultAsync(x => x.UserId == userId);
    }

    public async Task AddAsync(User user)
    {
        try
        {
            _db.Users.Add(user);
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            var sqlError = ex.InnerException?.Message;
            throw new PersistenceException(sqlError ?? ex.Message);
        }
    }

    public async Task UpdateAsync(User user)
    {
        _db.Users.Update(user);
        await _db.SaveChangesAsync();
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken ct)
    {
        return await _db
            .Users.Include(u => u.StudentProfile)
            .FirstOrDefaultAsync(x => x.Email == email, ct);
    }

    public async Task<List<User>> ListAsync(
        string? verificationStatus,
        bool? hasStrikes,
        string? search,
        int skip,
        int take,
        CancellationToken ct = default
    )
    {
        return await _db
            .Users.Include(u => u.StudentProfile)
            .OrderBy(u => u.CreatedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync(ct);
    }

    public async Task<int> CountAsync(
        string? verificationStatus,
        bool? hasStrikes,
        string? search,
        CancellationToken ct = default
    )
    {
        return await _db.Users.CountAsync(ct);
    }
}
