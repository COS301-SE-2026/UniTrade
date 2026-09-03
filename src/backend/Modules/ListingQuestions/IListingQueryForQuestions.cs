namespace Modules.ListingQuestions;

public interface IListingQueryForQuestions
{
    Task<ListingQnAInfo?> GetForQuestionsAsync(Guid listingId, CancellationToken ct = default);
}
public record ListingQnAInfo(Guid SellerId, bool IsLive);
