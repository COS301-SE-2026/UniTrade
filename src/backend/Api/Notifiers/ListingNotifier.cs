using Api.Hubs;
using Microsoft.AspNetCore.SignalR;
using Modules.Listings;

namespace Api.Notifiers;

public class ListingNotifier : IListingNotifier
{
    private readonly IHubContext<ChatHub> _hub;

    public ListingNotifier(IHubContext<ChatHub> hub) => _hub = hub;

    public Task ListingReservedAsync(Guid listingId, CancellationToken ct = default)
    {
        return _hub.Clients.All.SendAsync("ListingReserved", new { listingId }, ct);
    }

    public Task ListingReleasedAsync(Guid listingId, CancellationToken ct = default) =>
        _hub.Clients.All.SendAsync("ListingReleased", new { listingId }, ct);
}
