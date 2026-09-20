using Modules.Listings.Models;
using Modules.Listings.Models.Dto;
using Modules.Listings.Moderation;
using Modules.Listings.Repositories;
using Modules.Notifications;
using Modules.Listings;

namespace Modules.Listings.Admin;

public class AdminListingRiskService : IAdminListingRiskService
{
    private readonly IListingRepository _listings;
    private IModerationService _moderation;
    private INotificationDispatcher _notifications;
    private readonly IListingPublishedListener _listener;

    public AdminListingRiskService(IListingRepository listings, IModerationService moderation, INotificationDispatcher notifications, IListingPublishedListener listener)
    {
        _listings = listings;
        _moderation = moderation;
        _notifications = notifications;
        _listener = listener;
    }

    public async Task<IReadOnlyList<FlaggedListingDto>> GetFlaggedAsync(string status, CancellationToken ct = default)
    {
        var filter = new ListFilterDto { ListingStatus = status, Take = 100 };
        var (items, _) = await _listings.ListAsync(filter);

        return items
            .Select(l => new FlaggedListingDto(
                l.ListingId,
                l.Title,
                l.Price,
                l.SellerId,
                SellerInitials(l.Seller),
                l.AiRiskScore ?? 0m,
                l.AiRiskLevel ?? "low",
                l.AiRiskReasons?.ToList() ?? new List<string>(),
                null,
                l.CreatedAt
            )).ToList();
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

    public async Task<ListingSummaryDto?> DecideAsync(Guid listingId, string action, string reason, Guid adminId, CancellationToken ct = default)
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

        if (action == "remove")
        {
            var removed = await _moderation.RemoveListingAsync(listingId, reason, ct);
            if (!removed)
            {
                return null;
            }
            await _notifications.NotifyAsync(listing.SellerId, NotificationTypes.ListingStatus, $"Your listing '{listing.Title}' was removed. Reason: {reason}", ct);
        }

        listing.ListingStatus = "live";
        listing.VisibilityScore = 100;
        listing.UpdatedAt = DateTime.UtcNow;

        await _listings.SaveAsync();
        await _notifications.NotifyAsync(listing.SellerId, NotificationTypes.ListingStatus, $"Your listing '{listing.Title}' has been approved and is now live.", ct);

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
        catch (Exception)
        { }
        return ListingService.MapToSummary(listing);
    }

}
