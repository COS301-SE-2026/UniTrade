using Modules.Listings.Repositories;

namespace Modules.Listings.Moderation;

public class ModerationService : IModerationService
{
    private readonly IListingRepository _listings;

    public ModerationService(IListingRepository listings)
    {
        _listings = listings;
    }

    public Task<bool> RemoveListingAsync(
        Guid listingId,
        string reason,
        CancellationToken ct = default
    ) => _listings.AdminRemoveAsync(listingId, reason, ct);
}
