using Modules.Identity.Models;

namespace Modules.Identity.Repositories;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);

    Task<User?> GetByIdAsync(Guid userId);
    Task AddAsync(User user);

    Task UpdateAsync(User user);
}
