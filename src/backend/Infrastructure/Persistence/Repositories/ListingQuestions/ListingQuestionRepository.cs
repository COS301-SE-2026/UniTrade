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
    public async Task<Dictionary<Guid, int>> GetAnsweredQuestionCountsAsync(
     IEnumerable<Guid> listingIds,
     CancellationToken ct = default
 )
    {
        var ids = listingIds.ToList();
        if (ids.Count == 0)
        {
            return new Dictionary<Guid, int>();
        }
        return await _db.ListingQuestions
               .AsNoTracking()
               .Where(q => ids.Contains(q.ListingId) && q.AnswerText != null && q.AnswerText != "")
               .GroupBy(q => q.ListingId)
               .Select(g => new { ListingId = g.Key, Count = g.Count() })
               .ToDictionaryAsync(x => x.ListingId, x => x.Count, ct);
    }
}
