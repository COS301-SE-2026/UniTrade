using Modules.Listings.Moderation;
using Modules.Reputation;

namespace Modules.Disputes;

public class CaseOutcomeApplier : ICaseOutcomeApplier
{
    private readonly IReputationService _reputation;
    private readonly IModerationService _moderation;

    public CaseOutcomeApplier(IReputationService reputation, IModerationService moderation)
    {
        _reputation = reputation;
        _moderation = moderation;
    }

    public async Task ApplyAsync(
        IReadOnlyList<DisputeOutcome> outcomes,
        CaseOutcomeContext context,
        CancellationToken ct = default
    )
    {
        foreach (var outcome in outcomes)
        {
            switch (outcome)
            {
                case DisputeOutcome.Strike:
                    await _reputation.AddStrikeAsync(
                        context.SubjectUserId,
                        context.CaseId,
                        "strike",
                        context.Reason ?? "strike",
                        context.AdminId,
                        ct
                    );
                    break;
                case DisputeOutcome.RefusalFlag:
                    await _reputation.AddStrikeAsync(
                        context.SubjectUserId,
                        context.CaseId,
                        "refusal_flag",
                        context.Reason ?? "seller refused photos",
                        context.AdminId,
                        ct
                    );
                    break;
                case DisputeOutcome.RemoveListing:
                    if (context.ListingId is null)
                    {
                        throw new DisputesException("remove_listing_requires_listing");
                    }
                    await _moderation.RemoveListingAsync(
                        context.ListingId.Value,
                        context.Reason ?? "removed by admin decision",
                        ct
                    );
                    break;
            }
        }
    }
}
