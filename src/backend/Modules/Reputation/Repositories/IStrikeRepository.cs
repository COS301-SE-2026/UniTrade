using Modules.Reputation.Models;

namespace Modules.Reputation.Repositories;

public interface IStrikeRepository
{
    Task AddAsync(Strike strike, CancellationToken ct = default);
    Task<IReadOnlyList<Strike>> ListForUserAsync(Guid userId, CancellationToken ct = default);
}
