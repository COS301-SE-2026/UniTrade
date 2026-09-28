using Microsoft.Extensions.Logging;
using Modules.Audit;
using Modules.Identity.Models;
using Modules.Identity.Repositories;
using Modules.Listings.Repositories;
using Modules.Notifications;
using Modules.Reservations;
using Modules.Reservations.Models.Dto;

namespace Modules.Reputation;

public class AccountSanctionService : IAccountSanctionService
{
    private const string _sellerScope = "seller";
    private const string _buyerScope = "buyer";

    private const int _sellerStrikeThreshold = 3;
    private const int _buyerStrikeThreshold = 5;
    private const int _permanentBanAfterTempBans = 3;
    private static readonly TimeSpan _tempBanDuration = TimeSpan.FromDays(30);

    private const string _activeReservationStatus = "active";
    private readonly IReputationService _reputation;
    private readonly IUserRepository _users;
    private readonly IListingRepository _listings;

    private readonly IReservationService _reservations;
    private readonly IAuditService _audit;
    private readonly IBroadCastService _broadCast;
    private readonly INotificationDispatcher _notifications;
    private readonly ILogger<AccountSanctionService> _logger;

    public AccountSanctionService(
        IReputationService reputation,
        IUserRepository users,
        IListingRepository listings,
        IReservationService reservations,
        IAuditService audit,
        IBroadCastService broadCast,
        INotificationDispatcher notifications,
        ILogger<AccountSanctionService> logger
    )
    {
        _reputation = reputation;
        _users = users;
        _listings = listings;
        _reservations = reservations;
        _audit = audit;
        _broadCast = broadCast;
        _notifications = notifications;
        _logger = logger;
    }

    public async Task ApplyStrikeAsync(
        Guid userId,
        Guid? sourceCaseId,
        string type,
        string reason,
        Guid adminId,
        string scope,
        CancellationToken ct = default
    )
    {
        var normalisedScope = string.Equals(scope, _buyerScope, StringComparison.OrdinalIgnoreCase)
            ? _buyerScope
            : _sellerScope;

        await _reputation.AddStrikeAsync(
            userId,
            sourceCaseId,
            type,
            reason,
            adminId,
            normalisedScope,
            ct
        );

        await EvaluateAsync(userId, normalisedScope, ct);
    }

    private async Task EvaluateAsync(Guid userId, string scope, CancellationToken ct)
    {
        var threshold = scope == _buyerScope ? _buyerStrikeThreshold : _sellerStrikeThreshold;

        var bannable = await _reputation.CountBannableStrikeAsync(userId, scope, ct);
        var bansDeserved = bannable / threshold;

        var user = await _users.GetByIdAsync(userId);
        if (user is null)
        {
            return;
        }

        var bansApplied = scope == _buyerScope ? user.BuyerBanCount : user.SellerBanCount;
        if (bansDeserved <= bansApplied)
        {
            return;
        }

        var now = DateTime.UtcNow;

        if (scope == _buyerScope)
        {
            user.BuyerBanCount = bansDeserved;
            user.BuyerBannedUntil = now + _tempBanDuration;
        }
        else
        {
            user.SellerBanCount = bansDeserved;
            user.SellerBannedUntil = now + _tempBanDuration;
            await _listings.SuspendAllLiveBySellerAsync(userId, ct);
        }

        user.UpdatedAt = now;
        await _users.UpdateAsync(user);

        var until = now + _tempBanDuration;
        await AuditSystemActionAsync(
            userId,
            scope == _buyerScope ? "buyer_suspended" : "seller_suspended",
            $"Suspended from {(scope == _buyerScope ? "buying" : "selling")} until {until:yyyy-MM-dd} (strike threshold reached).",
            ct
        );
        await NotifyUserAsync(
            userId,
            $"You've been temporarily suspended from {(scope == _buyerScope ? "buying" : "selling")} until {until:d MMM yyyy} due to repeated strikes.",
            ct
        );

        if (user.SellerBanCount + user.BuyerBanCount >= _permanentBanAfterTempBans)
        {
            await ApplyPermanentBanAsync(user, ct);
        }
    }

    private async Task ApplyPermanentBanAsync(User user, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        user.IsBlocked = true;
        user.BlockedUntil = now.AddYears(100);
        user.UpdatedAt = now;
        await _users.UpdateAsync(user);

        await _listings.RestoreSuspendedBySellerAsync(user.UserId, ct);
        await _listings.MarkAllBySellerAsRemovedAsync(
            user.UserId,
            "Account permanently banned after repeated suspensions."
        );

        await CancelActiveReservationsAsync(user.UserId, ct);

        await AuditSystemActionAsync(
            user.UserId,
            "account_permanently_banned",
            "Account permanently banned after repeated suspensions.",
            ct
        );

        await NotifyUserAsync(
            user.UserId,
            "Your account has been permanently banned after repeated suspensions.",
            ct
        );
    }

    private async Task CancelActiveReservationsAsync(Guid userId, CancellationToken ct)
    {
        foreach (var role in new[] { _buyerScope, _sellerScope })
        {
            IReadOnlyList<ReservationListItemDto> items;
            try
            {
                items = await _reservations.ListForUserAsync(userId, role, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to list {Role} reservations for banned user {UserId}",
                    role,
                    userId
                );
                continue;
            }

            foreach (var item in items.Where(i => i.ReservationStatus == _activeReservationStatus))
            {
                try
                {
                    await _reservations.CancelBySystemAsync(
                        item.ReservationId,
                        "Counterparty account permanently banned.",
                        ct
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogError(
                        ex,
                        "Failed to cancel reservation {ReservationId} after permanent ban",
                        item.ReservationId
                    );
                    continue;
                }
            }
        }
    }

    public async Task LiftExpiredSuspensionsAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var users = await _users.ListExpiredSuspensionAsync(now, ct);

        foreach (var user in users)
        {
            if (user.IsBlocked)
            {
                continue;
            }

            var changed = false;

            if (user.SellerBannedUntil is DateTime sellerUntil && sellerUntil <= now)
            {
                await _listings.RestoreSuspendedBySellerAsync(user.UserId, ct);
                user.SellerBannedUntil = null;
                changed = true;
            }

            if (user.BuyerBannedUntil is DateTime buyerUntil && buyerUntil <= now)
            {
                user.BuyerBannedUntil = null;
                changed = true;
            }
            if (changed)
            {
                user.UpdatedAt = now;
                await _users.UpdateAsync(user);
            }
        }
    }

    private async Task AuditSystemActionAsync(
        Guid userId,
        string action,
        string detail,
        CancellationToken ct
    )
    {
        try
        {
            await _audit.WriteAsync(
                new AuditWriteRequest(
                    ActorId: Guid.Empty,
                    Action: action,
                    EntityType: "user",
                    EntityId: userId.ToString(),
                    OldValue: null,
                    NewValue: detail,
                    Reason: "Automated strike escalation"
                ),
                ct
            );

            await _broadCast.NotifyAdminAsync(
                "audit_event",
                new
                {
                    action,
                    entityType = "user",
                    entityId = userId.ToString(),
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to audit {Action} for user {UserId}", action, userId);
        }
    }

    private async Task NotifyUserAsync(Guid userId, string message, CancellationToken ct)
    {
        try
        {
            await _notifications.NotifyAsync(userId, NotificationTypes.Dispute, message, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to notify user {UserId} of a sanction", userId);
        }
    }
}
