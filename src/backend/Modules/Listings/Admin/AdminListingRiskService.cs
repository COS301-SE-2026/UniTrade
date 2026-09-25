using Modules.Audit.Models;
using Modules.Audit.Repositories;
using Modules.Identity.Repositories;
using Modules.Listings;
using Modules.Listings.Models;
using Modules.Listings.Models.Dto;
using Modules.Listings.Moderation;
using Modules.Listings.Repositories;
using Modules.Notifications;
using Modules.Reputation.Repositories;

namespace Modules.Listings.Admin;

public class AdminListingRiskService : IAdminListingRiskService
{
    private readonly IListingRepository _listings;
    private readonly IModerationService _moderation;
    private readonly INotificationDispatcher _notifications;
    private readonly IListingPublishedListener _listener;
    private readonly IUserRepository _users;
    private readonly IStrikeRepository _strikes;
    private readonly IAuditRepository _audits;
    private readonly IListingNotifier _notifier;

    public AdminListingRiskService(
        IListingRepository listings,
        IModerationService moderation,
        INotificationDispatcher notifications,
        IListingPublishedListener listener,
        IUserRepository users,
        IStrikeRepository strikes,
        IAuditRepository audits,
        IListingNotifier notifier
    )
    {
        _listings = listings;
        _moderation = moderation;
        _notifications = notifications;
        _listener = listener;
        _users = users;
        _strikes = strikes;
        _audits = audits;
        _notifier = notifier;
    }

    public async Task<IReadOnlyList<FlaggedListingDto>> GetFlaggedAsync(
        string status,
        CancellationToken ct = default
    )
    {
        var filter = new ListFilterDto { ListingStatus = status, Take = 100 };
        var (items, _) = await _listings.ListAsync(filter);

        return items
            .GroupBy(l => l.ListingGroupId ?? l.ListingId)
            .Select(g =>
            {
                var l = g.OrderBy(x => x.CreatedAt).ThenBy(x => x.ListingId).First();
                return new FlaggedListingDto(
                    l.ListingId,
                    l.Title,
                    l.Price,
                    l.SellerId,
                    SellerInitials(l.Seller),
                    l.AiRiskScore ?? 0m,
                    l.AiRiskLevel ?? "low",
                    l.AiRiskReasons?.Select(r => r.Code).ToList() ?? new List<string>(),
                    l.ImageMatchScore,
                    l.CreatedAt,
                    g.Count()
                );
            })
            .ToList();
    }

    private static string SellerInitials(SellerInfo? seller)
    {
        if (seller is null)
        {
            return "??";
        }
        var first = string.IsNullOrEmpty(seller.FirstName) ? "" : seller.FirstName[0].ToString();
        var last = string.IsNullOrEmpty(seller.LastName) ? "" : seller.LastName[0].ToString();
        var initials = (first + last).ToUpperInvariant();
        return initials.Length == 0 ? "??" : initials;
    }

    public async Task<ListingSummaryDto?> DecideAsync(
        Guid listingId,
        string action,
        string reason,
        Guid adminId,
        CancellationToken ct = default
    )
    {
        if (action != "approve" && action != "remove")
        {
            throw new ArgumentException("invalid_action");
        }
        var listing = await _listings.GetByIdTrackedAsync(listingId);
        if (listing is null)
        {
            return null;
        }

        var statusBeforeDecision = listing.ListingStatus;

        if (action == "remove" && string.IsNullOrWhiteSpace(reason))
        {
            throw new ArgumentException("reason_required");
        }

        var siblingIds = new List<Guid>();
        if (listing.ListingGroupId is Guid groupId)
        {
            var siblings = await _listings.GetByGroupIdAsync(groupId, includeRemoved:false,ct);
            siblingIds = siblings
                .Where(s => s.ListingId != listingId && s.ListingStatus == "under_review")
                .Select(s => s.ListingId)
                .ToList();
        }
        var copies = siblingIds.Count + 1;
        var result = await DecideOneAsync(listingId, action, reason, adminId, copies, true, ct);

        foreach (var siblingId in siblingIds)
        {
            await DecideOneAsync(siblingId, action, reason, adminId, copies, false, ct);
        }

        return result;
    }

    private async Task<ListingSummaryDto?> DecideOneAsync(
        Guid listingId,
        string action,
        string reason,
        Guid adminId,
        int copies,
        bool notifyText,
        CancellationToken ct
    )
    {
        var listing = await _listings.GetByIdTrackedAsync(listingId);
        if (listing is null)
        {
            return null;
        }

        var statusBeforeDecision = listing.ListingStatus;
        var label = copies > 1 ? $"'{listing.Title}' ({copies} copies)" : $"'{listing.Title}'";

        if (action == "remove")
        {
            var removed = await _moderation.RemoveListingAsync(listingId, reason, ct);
            if (!removed)
            {
                return null;
            }
            listing.ListingStatus = "removed";
            listing.RejectionReason = reason;
            listing.UpdatedAt = DateTime.UtcNow;

            await _audits.AddAsync(
                new AuditLog
                {
                    ActorId = adminId,
                    Action = "listing.removed",
                    EntityType = "Listing",
                    EntityId = listingId.ToString(),
                    OldValue = statusBeforeDecision,
                    NewValue = "removed",
                    Reason = reason,
                },
                ct
            );
            await _notifier.ListingStatusChangedAsync(
                listing.SellerId,
                listingId,
                "removed",
                listing.AiRiskLevel ?? "low",
                ct
            );
            if (notifyText)
            {
                await _notifications.NotifyAsync(
                    listing.SellerId,
                    NotificationTypes.ListingStatus,
                    $"Your listing {label} was removed. Reason: {reason}",
                    ct
                );
            }
            return ListingService.MapToSummary(listing);
        }

        listing.ListingStatus = "live";
        listing.VisibilityScore = 100;
        listing.UpdatedAt = DateTime.UtcNow;

        await _listings.SaveAsync();

        await _audits.AddAsync(
            new AuditLog
            {
                ActorId = adminId,
                Action = "listing.approved",
                EntityType = "Listing",
                EntityId = listingId.ToString(),
                OldValue = statusBeforeDecision,
                NewValue = "live",
                Reason = reason,
            },
            ct
        );
        await _notifier.ListingStatusChangedAsync(
            listing.SellerId,
            listingId,
            "live",
            listing.AiRiskLevel ?? "low",
            ct
        );

        if (notifyText)
        {
            await _notifications.NotifyAsync(
                listing.SellerId,
                NotificationTypes.ListingStatus,
                $"Your listing {label} has been approved and is now live.",
                ct
            );
        }
        try
        {
            var evnt = new ListingPublishedEvent
            {
                ListingId = listing.ListingId,
                Title = listing.Title,
                Description = listing.Description,
                Price = listing.Price,
                CategoryId = listing.CategoryId,
                CourseId = listing.CourseId,
                SellerId = listing.SellerId,
            };
            await _listener.OnListingPublishedEventAsync(evnt, ct);
        }
        catch (Exception) { }
        return ListingService.MapToSummary(listing);
    }

    public async Task<FlaggedListingDetailDto?> GetFlaggedDetailAsync(
        Guid listingId,
        CancellationToken ct = default
    )
    {
        var listing = await _listings.GetByIdAsync(listingId);
        if (listing is null)
        {
            return null;
        }

        var copyCount = 1;
        if (listing.ListingGroupId is Guid groupId)
        {
            var siblings = await _listings.GetByGroupIdAsync(groupId, includeRemoved: false,ct);
            copyCount = Math.Max(1, siblings.Count(s => s.ListingStatus == "under_review"));
        }
        var seller = await _users.GetByIdAsync(listing.SellerId);
        var verificationStatus = seller?.StudentProfile?.VerificationStatus ?? "unknown";
        var strikeCount = await _strikes.CountForUserAsync(listing.SellerId, ct);
        var priorFlagCount = await _listings.CountHighRiskListingsForSellerAsync(
            listing.SellerId,
            listing.ListingId,
            ct
        );

        var sellerName = listing.Seller is null
            ? "Unknown"
            : $"{listing.Seller.FirstName} {listing.Seller.LastName}".Trim();

        return new FlaggedListingDetailDto(
            listing.ListingId,
            listing.Title,
            listing.Description,
            listing.Price,
            listing.Condition,
            listing.Category?.Name ?? "",
            listing
                .Images.Select(i => $"/api/listings/{listing.ListingId}/images/{i.ImageId}")
                .ToList(),
            new FlaggedListingSellerDto(
                listing.SellerId,
                sellerName,
                SellerInitials(listing.Seller),
                verificationStatus,
                strikeCount,
                priorFlagCount
            ),
            listing.AiRiskScore ?? 0m,
            listing.AiRiskLevel ?? "low",
            listing.VisibilityScore,
            listing
                .AiRiskReasons?.Select(r => new ReasonDetailDto(r.Code, r.Detail, r.ImageId))
                .ToList()
                ?? new List<ReasonDetailDto>(),
            listing.ImageMatchScore,
            listing.CreatedAt,
            copyCount
        );
    }
}
