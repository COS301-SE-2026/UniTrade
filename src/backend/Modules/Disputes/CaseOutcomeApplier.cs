using Modules.Identity.Repositories;
using Modules.Listings.Moderation;
using Modules.Notifications;
using Modules.Reputation;
using Modules.Reservations;

namespace Modules.Disputes;

public class CaseOutcomeApplier : ICaseOutcomeApplier
{
    private readonly IReputationService _reputation;
    private readonly IModerationService _moderation;
    private readonly INotificationDispatcher _notifications;
    private readonly IEmailService _emails;
    private readonly IBroadCastService _broadCast;
    private readonly IUserRepository _users;

    public CaseOutcomeApplier(
        IReputationService reputation,
        IModerationService moderation,
        INotificationDispatcher notifications,
        IEmailService emails,
        IUserRepository users,
        IBroadCastService broadCastService
    )
    {
        _reputation = reputation;
        _moderation = moderation;
        _notifications = notifications;
        _emails = emails;
        _users = users;
        _broadCast = broadCastService;
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
        if (outcomes.Count > 0)
        {
            var summary = BuildOutcomeSummary(outcomes);

            try
            {
                await _notifications.NotifyAsync(
                    context.SubjectUserId,
                    "dispute_outcome",
                    $"{summary}{(string.IsNullOrWhiteSpace(context.Reason) ? "" : $" Reason: {context.Reason}")}",
                    ct
                );
            }
            catch { }

            try
            {
                await _broadCast.SendToUserAsync(
                    context.SubjectUserId,
                    "dispute_outcome",
                    new { message = summary, reason = context.Reason }
                );
            }
            catch { }

            try
            {
                var user = await _users.GetByIdAsync(context.SubjectUserId);
                if (user is not null && !string.IsNullOrWhiteSpace(user.Email))
                {
                    await _emails.SendDisputeOutcomeEmailAsync(
                        user.Email,
                        user.FirstName ?? "there",
                        summary,
                        context.Reason
                    );
                }
            }
            catch { }
        }
    }

    private static string BuildOutcomeSummary(IReadOnlyList<DisputeOutcome> outcomes)
    {
        var parts = new List<string>();
        if (outcomes.Contains(DisputeOutcome.RemoveListing))
            parts.Add("your listing was removed");
        if (outcomes.Contains(DisputeOutcome.Strike))
            parts.Add("a strike was applied to your account");
        if (outcomes.Contains(DisputeOutcome.RefusalFlag))
            parts.Add("a refusal flag was applied to your account");
        if (outcomes.Count == 0)
            return "A dispute involving your account was resolved.";
        var joined = string.Join(" and ", parts);
        return $"A dispute was resolved: {char.ToUpper(joined[0])}{joined[1..]}.";
    }
}
