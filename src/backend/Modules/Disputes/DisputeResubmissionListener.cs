using Modules.Disputes.Repositories;
using Modules.Listings.Repositories;
using Modules.Listings;
using Modules.Listings.Snapshot;

namespace Modules.Disputes;

public class DisputeResubmissionListener : IListingResubmissionListener
{
    private readonly IDisputeRepository _disputes;
    private readonly IListingRepository _listings;
    private readonly IListingSnapshotService _snapshots;

    public DisputeResubmissionListener(
        IDisputeRepository disputes,
        IListingRepository listings,
        IListingSnapshotService snapshots
    ) {
        _disputes = disputes;
        _listings = listings;
        _snapshots = snapshots;
    }

    public async Task OnListingResubmittedAsync(Guid listingId, CancellationToken ct = default)
    {
        var dispute = await _disputes.GetMostRecentReportDisputeForListingAsync(listingId, ct);

        if (dispute is null) return;

        var listing = await _listings.GetByIdAsync(listingId);
        if (listing is not null)
        {
            var snapshot = await _snapshots.CaptureForListingAsync(listing, ct);
            if (snapshot is not null)
            {
                await _disputes.UpdateSnapshotAsync(dispute.DisputeId, snapshot.SnapshotId, ct);
            }
        }
       
            await _disputes.ReopenAsResubmissionAsync(dispute.DisputeId, ct);
        
    }
}
