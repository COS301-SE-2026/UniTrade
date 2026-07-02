using Microsoft.EntityFrameworkCore;
using Modules.Identity;
using Modules.Identity.Models;
using Modules.Identity.Repositories;

namespace Infrastructure.Persistence.Repositories;

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
            throw new Exception(sqlError ?? ex.Message);
        }
    }

    public async Task UpdateAsync(User user)
    {
        _db.Users.Update(user);
        await _db.SaveChangesAsync();
    }
}
