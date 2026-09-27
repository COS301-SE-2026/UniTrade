using Modules.Disputes.Repositories;
using Modules.Listings.Repositories;
using Modules.Listings;
using Modules.Listings.Snapshot;
using Modules.Reservations;

namespace Modules.Disputes;

public class DisputeResubmissionListener : IListingResubmissionListener
{
    private readonly IDisputeRepository _disputes;
    private readonly IListingRepository _listings;
    private readonly IListingSnapshotService _snapshots;
    private readonly IBroadCastService _broadcast;

    public DisputeResubmissionListener(
        IDisputeRepository disputes,
        IListingRepository listings,
        IListingSnapshotService snapshots,
        IBroadCastService broadcast
    ) {
        _disputes = disputes;
        _listings = listings;
        _snapshots = snapshots;
        _broadcast = broadcast;
    }

    public async Task OnListingResubmittedAsync(Guid listingId, CancellationToken ct = default)
    {
        var dispute = await _disputes.GetMostRecentReportDisputeForListingAsync(listingId, ct);

        if (dispute is null) return;

        if (dispute.OriginalSnapshotId is null && dispute.SnapshotId.HasValue)
        {
            await _disputes.SetOriginalSnapshotAsync(dispute.DisputeId, dispute.SnapshotId.Value, ct);
        }

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

            await _broadcast.NotifyAdminAsync(
                "dispute_resubmitted",
                new { caseId = dispute.DisputeId }
            );
        
    }
}
