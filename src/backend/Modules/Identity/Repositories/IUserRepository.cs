using Modules.Identity.Models;

namespace Modules.Identity.Repositories;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);

    Task<User?> GetByIdAsync(Guid userId);
    Task AddAsync(User user);

    Task UpdateAsync(User user);
    Task<List<User>> ListAsync(
        string? verificationStatus,
        bool? hasStrikes,
        string? search,
        int skip,
        int take,
        CancellationToken ct = default
    );
    Task<int> CountAsync(
        string? verificationStatus,
        bool? hasStrikes,
        string? search,
        CancellationToken ct = default
    );
}
