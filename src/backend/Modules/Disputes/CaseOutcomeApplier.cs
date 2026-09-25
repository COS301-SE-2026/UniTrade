using Microsoft.Extensions.Logging;
using Modules.Identity.Repositories;
using Modules.Listings.Moderation;
using Modules.Listings.Repositories;
using Modules.Notifications;
using Modules.Reputation;
using Modules.Reservations;

namespace Modules.Disputes;

public class CaseOutcomeApplier : ICaseOutcomeApplier
{
    private readonly IReputationService _reputation;
    private readonly IModerationService _moderation;
    private readonly IListingRepository _listings;
    private readonly INotificationDispatcher _notifications;
    private readonly IEmailService _emails;
    private readonly IBroadCastService _broadCast;
    private readonly IUserRepository _users;
    private readonly ILogger<CaseOutcomeApplier> _logger;

    public CaseOutcomeApplier(
        IReputationService reputation,
        IModerationService moderation,
        IListingRepository listings,
        INotificationDispatcher notifications,
        IEmailService emails,
        IUserRepository users,
        IBroadCastService broadCastService,
        ILogger<CaseOutcomeApplier> logger
    )
    {
        _reputation = reputation;
        _moderation = moderation;
        _listings = listings;
        _notifications = notifications;
        _emails = emails;
        _users = users;
        _broadCast = broadCastService;
        _logger = logger;
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
                    await ApplyToGroupAsync(
                        context.ListingId,
                        l =>
                            _moderation.RemoveListingAsync(
                                l,
                                context.Reason ?? "removed by an admin decision",
                                ct
                            ),
                        ct
                    );
                    break;
                case DisputeOutcome.WarnSellerResubmit:
                    await ApplyToGroupAsync(
                        context.ListingId,
                        l =>
                            _moderation.WarnSellerAsync(
                                l,
                                context.Reason
                                    ?? "Listing needs correction before it can be relisted",
                                ct
                            ),
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
            catch (Exception e)
            {
                _logger.LogWarning(
                    e,
                    "Failed to send notification for outcome {Outcome} to user {UserId}",
                    summary,
                    context.SubjectUserId
                );
            }

            try
            {
                await _broadCast.SendToUserAsync(
                    context.SubjectUserId,
                    "dispute_outcome",
                    new { message = summary, reason = context.Reason }
                );
            }
            catch (Exception e)
            {
                _logger.LogWarning(
                    e,
                    "Failed to send broadcast for outcome {Outcome} to user {UserId}",
                    summary,
                    context.SubjectUserId
                );
            }

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
            catch (Exception e)
            {
                _logger.LogWarning(
                    e,
                    "Failed to send email for outcome {Outcome} to user {UserId}",
                    summary,
                    context.SubjectUserId
                );
            }
        }
    }

    private async Task ApplyToGroupAsync(
        Guid? listingId,
        Func<Guid, Task> action,
        CancellationToken ct
    )
    {
        if (listingId is null)
            throw new DisputesException("outcome_requires_listing");
        await action(listingId.Value);

        var listing = await _listings.GetByIdAnyStatusAsync(listingId.Value);
        if (listing?.ListingGroupId is Guid groupId)
        {
            var siblings = await _listings.GetByGroupIdAsync(groupId, includeRemoved: false, ct);
            foreach (var sibling in siblings.Where(s => s.ListingId != listingId.Value))
            {
                await action(sibling.ListingId);
            }
        }
    }

    private static string BuildOutcomeSummary(IReadOnlyList<DisputeOutcome> outcomes)
    {
        var parts = new List<string>();
        if (outcomes.Contains(DisputeOutcome.RemoveListing))
            parts.Add("your listing was removed");
        if (outcomes.Contains(DisputeOutcome.WarnSellerResubmit))
            parts.Add(
                "your listing needs corrections before it can be relisted - you can edit and resubmit it"
            );
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
