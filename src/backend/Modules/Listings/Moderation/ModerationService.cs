using Modules.Listings.Repositories;

namespace Modules.Listings.Moderation;

public class ModerationService : IModerationService
{
    private readonly IListingRepository _listings;
    private readonly IListingNotifier _notifier;

    public ModerationService(IListingRepository listings, IListingNotifier notifier)
    {
        _listings = listings;
        _notifier = notifier;
    }

    public async Task<bool> RemoveListingAsync(
        Guid listingId,
        string reason,
        CancellationToken ct = default
    ) {
        var listing = await _listings.GetByIdAnyStatusAsync(listingId);

        var result = await _listings.AdminRemoveAsync(listingId, reason, ct);
        if (result && listing is not null)
        {
            await _notifier.ListingStatusChangedAsync(listing.SellerId, listingId, "banned", listing.AiRiskLevel ?? "low", ct);

        }
        return result;

    }

    public async Task<bool> WarnSellerAsync(Guid listingId, string reason, CancellationToken ct = default){
        var listing = await _listings.GetByIdAnyStatusAsync(listingId);

        var result = await _listings.WarnSellerAsync(listingId, reason, ct);
        if (result && listing is not null)
        {
            await _notifier.ListingStatusChangedAsync(listing.SellerId, listingId, "removed", listing.AiRiskLevel ?? "low", ct);

        }
        return result;
    }

    public async Task<bool> SetUnderReviewAsync(Guid listingId,string reason, CancellationToken ct = default) {
        var listing = await _listings.GetByIdAnyStatusAsync(listingId);

        var result = await _listings.SetUnderReviewAsync(listingId, reason, ct);
        if (result && listing is not null)
        {
            await _notifier.ListingStatusChangedAsync(listing.SellerId, listingId, "under_review", listing.AiRiskLevel ?? "low", ct);

        }
        return result;
    }

    public async Task<bool> RestoreToLiveAsync(Guid listingId, CancellationToken ct = default) {
        var listing = await _listings.GetByIdAnyStatusAsync(listingId);

        var result = await _listings.RestoreToLiveAsync(listingId, ct);
        if (result && listing is not null)
        {
            await _notifier.ListingStatusChangedAsync(listing.SellerId, listingId, "live", listing.AiRiskLevel ?? "low", ct);

        }
        return result;
    }
       
}
