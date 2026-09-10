using Modules.Reputation.Models;
using Modules.Reputation.Repositories;
using Modules.Reviews.Repositories;

namespace Modules.Reputation;

public class ReputationService : IReputationService
{
    private readonly IStrikeRepository _strikes;
    private readonly IReviewRepository _reviews;

    public ReputationService(IStrikeRepository strikes, IReviewRepository reviews)
    {
        _strikes = strikes;
        _reviews = reviews;
    }

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

    public async Task<ReputationSummary> GetReputationSummaryAsync(
       Guid userId,
       CancellationToken ct = default
    )
    {
        var reviews = await _reviews.GetForUserAsync(userId, ct);

        if (reviews.Count == 0)
        {
            return new ReputationSummary(0, 0, 0);
        }

        var average = Math.Round(reviews.Average(r => (double)r.Rating), 1);
        var reputationScore = (int)
            Math.Round(Math.Min(100, average / 5.0 * 80 + Math.Min(20, reviews.Count * 2)));

        return new ReputationSummary(average, reputationScore, reviews.Count);
    }
}
