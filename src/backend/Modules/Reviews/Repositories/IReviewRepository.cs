using Modules.Reviews.Models;

namespace Modules.Reviews.Repositories;

public interface IReviewRepository
{
    Task AddAsync(Review review, CancellationToken ct = default);
    Task<bool> ExistsAsync(Guid transactionId, Guid reviewerId, CancellationToken ct = default);
    Task<IReadOnlyList<Review>> GetForUserAsync(Guid userId, CancellationToken ct = default);
    Task SaveAsync(CancellationToken ct = default);
}
