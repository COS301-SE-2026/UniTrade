using Modules.Listings.Models.Dto;

namespace Modules.Disputes;

public sealed record ListingQualityVerdict(
    DisputeCaseDecision Decision,
    IReadOnlyList<DisputeOutcome> Outcomes
);

public static class ListingQualityEvaluator
{
    public static ListingQualityVerdict Evaluate(
        ListingSnapshotDto? snapshot,
        IReadOnlyList<string> buyerPhotos,
        bool sellerRefusedPhotos
    )
    {
        // if no snapshot capture no objective decision can be made
        if (snapshot is null)
        {
            return new(DisputeCaseDecision.Dismiss, Array.Empty<DisputeOutcome>());
        }

        // if seller refused photos, flag them
        if (sellerRefusedPhotos)
        {
            return new(DisputeCaseDecision.Uphold, new[] { DisputeOutcome.RefusalFlag });
        }

        // if no photos , no refusal claim, theres nothing concrete to weigh, dismiss
        if (buyerPhotos.Count == 0)
        {
            return new(DisputeCaseDecision.Dismiss, Array.Empty<DisputeOutcome>());
        }

        // the real case->photos upload, but we cant compare the to the snapshot, so defer to admin
        return new(
            DisputeCaseDecision.RequestInfo,
            Array.Empty<DisputeOutcome>()
        );
    }
}
