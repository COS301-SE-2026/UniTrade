namespace Modules.Listings;

public static class ListingNotifierExtensions 
{
    public static async Task BroadcastBrowseChangeAsync(
        this IListingNotifier notifier,
        Guid listingId,
        bool nowVisible,
        CancellationToken ct = default
    )
    {
        try 
        {
            if (nowVisible)
                await notifier.ListingLiveAsync(listingId, ct);
            else
                await notifier.ListingReleasedAsync(listingId, ct);
        }
        catch (Exception) when (!ct.IsCancellationRequested)
        {
            //
        }
    }
}