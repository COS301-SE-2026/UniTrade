using Modules.Reputation.Models;
using Modules.Reputation.Repositories;

namespace Modules.Reputation;

public class ReputationService : IReputationService
{
    private readonly IStrikeRepository _strikes;

    public ReputationService(IStrikeRepository strikes) => _strikes = strikes;

    public Task AddStrikeAsync(
        Guid userID,
        Guid? sourceCaseId,
        string type,
        string reason,
        Guid adminId,
        CancellationToken ct = default
    ) =>
        _strikes.AddAsync(
            new Strike
            {
                StrikeId = Guid.NewGuid(),
                UserId = userID,
                SourceCaseId = sourceCaseId,
                Type = type,
                Reason = reason,
                CreatedByAdminId = adminId,
            },
            ct
        );

    public Task<IReadOnlyList<Strike>> GetStrikesAsync(
        Guid userId,
        CancellationToken ct = default
    ) => _strikes.ListForUserAsync(userId, ct);
}
