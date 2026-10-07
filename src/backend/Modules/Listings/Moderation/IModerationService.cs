namespace Modules.Listings.Moderation;

public interface IModerationService
{
    Task<bool> RemoveListingAsync(Guid listingId, string reason, CancellationToken ct = default);
    Task<bool> WarnSellerAsync(Guid listingId, string reason, CancellationToken ct = default);
    Task<bool> SetUnderReviewAsync(Guid listingId, string reason, CancellationToken ct = default);
    Task<bool> RestoreToLiveAsync(Guid listingId, CancellationToken ct = default);
}
