using Modules.Listings.Models;
using Modules.Listings.Models.Dto;
using Modules.Listings.Moderation;
using Modules.Listings.Repositories;
using Modules.Notifications;
using Modules.Listings;
using Modules.Reputation.Repositories;
using Modules.Identity.Repositories;

namespace Modules.Listings.Admin;

public class AdminListingRiskService : IAdminListingRiskService
{
    private readonly IListingRepository _listings;
    private readonly IModerationService _moderation;
    private readonly INotificationDispatcher _notifications;
    private readonly IListingPublishedListener _listener;
    private readonly IUserRepository _users;
    private readonly IStrikeRepository _strikes;

    public AdminListingRiskService(IListingRepository listings, IModerationService moderation, INotificationDispatcher notifications, IListingPublishedListener listener, IUserRepository users, IStrikeRepository strikes)
    {
        _listings = listings;
        _moderation = moderation;
        _notifications = notifications;
        _listener = listener;
        _users = users;
        _strikes = strikes;
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
                l.AiRiskReasons?.Select(r => string.IsNullOrEmpty(r.Detail) ? r.Code : r.Detail).ToList() ?? new List<string>(),
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

    public async Task<FlaggedListingDetailDto?> GetFlaggedDetailAsync(Guid listingId, CancellationToken ct = default)
    {
        var listing = await _listings.GetByIdAsync(listingId);
        if (listing is null)
        {
            return null;
        }

        var seller = await _users.GetByIdAsync(listing.SellerId);
        var verificationStatus = seller?.StudentProfile?.VerificationStatus ?? "unknown";
        var strikeCount = await _strikes.CountForUserAsync(listing.SellerId, ct);
        var priorFlagCount = await _listings.CountHighRiskListingsForSellerAsync(listing.SellerId, listing.ListingId, ct);

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
            listing.Images.Select(i => $"/api/listings/{listing.ListingId}/images/{i.ImageId}").ToList(),
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
            listing.AiRiskReasons?.Select(r => new ReasonDetailDto(r.Code, r.Detail)).ToList() ?? new List<ReasonDetailDto>(),
            null,
            listing.CreatedAt
        );
    }

}
