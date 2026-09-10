using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Modules.Reviews.Models;
using Modules.Reviews.Repositories;

namespace Infrastructure.Persistence.Repositories.Reviews;

public class ReviewRepository(AppDbContext db) : IReviewRepository
{
    private readonly AppDbContext _db = db;

    public async Task AddAsync(Review review, CancellationToken ct = default) =>
        await _db.Reviews.AddAsync(review, ct);

    public async Task<bool> ExistsAsync(
        Guid transactionId,
        Guid reviewerId,
        CancellationToken ct = default
    ) =>
        await _db.Reviews.AnyAsync(
            r => r.TransactionId == transactionId && r.ReviewerId == reviewerId,
            ct
        );

    public async Task<IReadOnlyList<Review>> GetForUserAsync(
        Guid userId,
        CancellationToken ct = default
    ) =>
        await _db
            .Reviews.Where(r => r.RevieweeId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(ct);

    public async Task SaveAsync(CancellationToken ct = default) => await _db.SaveChangesAsync(ct);
}
