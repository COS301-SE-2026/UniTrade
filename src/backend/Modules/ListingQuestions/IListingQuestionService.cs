using Modules.ListingQuestions.Models;

namespace Modules.ListingQuestions;

public interface IListingQuestionService
{
    Task<IReadOnlyList<ListingQuestionDto>> GetForListingAsync(
        Guid listingId,
        CancellationToken ct = default
    );
    Task<ListingQuestionDto> AskAsync(
        Guid listingId,
        Guid askerId,
        string questionText,
        CancellationToken ct = default
    );
    Task<ListingQuestionDto> AnswerAsync(
        Guid questionId,
        Guid callerId,
        string answerText,
        CancellationToken ct = default
    );
}
