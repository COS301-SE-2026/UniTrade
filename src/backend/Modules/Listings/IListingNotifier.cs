namespace Modules.Listings;

public interface IListingNotifier
{
    Task ListingReservedAsync(Guid listingId, CancellationToken ct = default);
    Task ListingReleasedAsync(Guid listingId, CancellationToken ct = default);
    Task ListingStatusChangedAsync(
        Guid sellerId,
        Guid listingId,
        string status,
        string riskLevel,
        CancellationToken ct = default
    );
}
