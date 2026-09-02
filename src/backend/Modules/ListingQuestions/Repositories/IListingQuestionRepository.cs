using Modules.ListingQuestions.Models;

namespace Modules.ListingQuestions.Repositories;

public interface IListingQuestionRepository
{
    Task<ListingQuestion> AddAsync(ListingQuestion question, CancellationToken ct = default);
    Task<ListingQuestion?> GetByIdTrackedAsync(Guid questionId, CancellationToken ct = default);
    Task<IReadOnlyList<ListingQuestion>> GetByListingAsync(
        Guid listingId,
        CancellationToken ct = default
    );
    Task SaveAsync(CancellationToken ct);
}
