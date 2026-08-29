using Modules.Reputation.Models;

namespace Modules.Reputation;

public interface IReputationService
{
    Task AddStrikeAsync(
        Guid userID,
        Guid? sourceCaseId,
        string type,
        string reason,
        Guid adminId,
        CancellationToken ct = default
    );
    Task<IReadOnlyList<Strike>> GetStrikesAsync(Guid userId, CancellationToken ct = default);
}
