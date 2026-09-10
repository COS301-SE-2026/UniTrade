namespace Modules.Listings.Moderation;

public interface IModerationService
{
    Task<bool> RemoveListingAsync(Guid listingId, string reason, CancellationToken ct = default);
}
