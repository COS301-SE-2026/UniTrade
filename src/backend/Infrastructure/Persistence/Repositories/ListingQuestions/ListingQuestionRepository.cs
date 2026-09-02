using Microsoft.EntityFrameworkCore;
using Modules.ListingQuestions.Models;
using Modules.ListingQuestions.Repositories;

namespace Infrastructure.Persistence.Repositories.ListingQuestions;

public class ListingQuestionRepository : IListingQuestionRepository
{
    private readonly AppDbContext _db;

    public ListingQuestionRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<ListingQuestion> AddAsync(
        ListingQuestion question,
        CancellationToken ct = default
    )
    {
        question.QuestionId = Guid.NewGuid();
        question.AskedAt = DateTime.UtcNow;
        _db.ListingQuestions.Add(question);
        await _db.SaveChangesAsync(ct);
        return question;
    }

    public async Task<ListingQuestion?> GetByIdTrackedAsync(
        Guid questionId,
        CancellationToken ct = default
    ) => await _db.ListingQuestions.FirstOrDefaultAsync(x => x.QuestionId == questionId, ct);

    public async Task<IReadOnlyList<ListingQuestion>> GetByListingAsync(
        Guid listingId,
        CancellationToken ct = default
    ) =>
        await _db
            .ListingQuestions.Where(x => x.ListingId == listingId)
            .OrderByDescending(x => x.AskedAt)
            .ToListAsync(ct);

    public Task SaveAsync(CancellationToken ct) => _db.SaveChangesAsync(ct);
}
