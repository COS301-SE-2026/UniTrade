using Modules.ListingQuestions;
using Modules.Listings.Repositories;

namespace Modules.Listings;

public class ListingQueryForQuestions : IListingQueryForQuestions
{
    private readonly IListingRepository _listings;

    public ListingQueryForQuestions(IListingRepository listings) => _listings = listings;

    public async Task<ListingQnAInfo?> GetForQuestionsAsync(
        Guid listingId,
        CancellationToken ct = default
    )
    {
        var listing = await _listings.GetByIdAsync(listingId);

        if (listing is null)
            return null;
        return new ListingQnAInfo(listing.SellerId, listing.ListingStatus == "live");
    }
}
