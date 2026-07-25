using Microsoft.Extensions.Logging;
using Modules.Chat;
using Modules.Listings;
using Modules.Listings.Repositories;
using Modules.Notifications;
using Modules.Reservations.Models;
using Modules.Reservations.Models.Dto;
using Modules.Reservations.Repositories;
using Modules.Reservations.StateMachine;
using Modules.Wishlist;

namespace Modules.Reservations;

public class ReservationService(
    IReservationRepository reservations,
    IListingRepository listings,
    IChatService chat,
    IBroadCastService broadcast,
    IReservationRealTime realtime,
    IListingNotifier listingNotifier,
    INotificationDispatcher pushNotifier,
    ILogger<ReservationService> logger,
    IWishlistService wishlist,
    TimeProvider clock
) : IReservationService
{
    private readonly IListingRepository _listings = listings;
    private readonly IReservationRepository _reservations = reservations;
    private readonly IChatService _chat = chat;
    private readonly IBroadCastService _broadcast = broadcast;
    private readonly IReservationRealTime _realtime = realtime;
    private readonly IListingNotifier _listingNotifier = listingNotifier;
    private readonly IWishlistService _wishlist = wishlist;
    private readonly INotificationDispatcher _pushNotifier = pushNotifier;
    private readonly ILogger<ReservationService> _logger = logger;
    private readonly TimeProvider _clock = clock;

    public async Task<ReservationDto> CreateAsync(
        Guid listingId,
        Guid buyerId,
        CancellationToken ct = default
    )
    {
        var listing =
            await _listings.GetByIdAsync(listingId)
            ?? throw new ReservationException(ReservationErrors.ListingNotFound);

        if (listing.SellerId == buyerId)
        {
            throw new ReservationException(ReservationErrors.SelfReserve);
        }
        if (!await _listings.TryReserveAsync(listingId, ct))
        {
            throw new ReservationException(ReservationErrors.AlreadyReserved);
        }
        var now = _clock.GetUtcNow().UtcDateTime;

        var reservation = new Reservation
        {
            ReservationId = Guid.NewGuid(),
            BuyerId = buyerId,
            SellerId = listing.SellerId,
            IsBundle = false,
            ReservationStatus = ReservationState.Active,
            ExpiresAt = now + ReservationStateMachine.ResponseWindow,
            CreatedAt = now,
            ReservationListings = { new ReservationListing { ListingId = listingId } },
        };

        await _reservations.AddAsync(reservation, ct);
        await _reservations.SaveAsync(ct);
        await _listingNotifier.ListingReservedAsync(listingId, ct);
        await _chat.SendSystemAsync(
            reservation.ReservationId,
            $"A buyer is interested in \"{listing.Title}\".",
            ct
        );
        await _wishlist.SuppressForListingAsync(listingId, reservation.ReservationId, ct);
        await GuardedPushAsync(
            listing.SellerId,
            NotificationTypes.ReservationStatus,
            $"A buyer is interested in \"{listing.Title}\".",
            ct
        );
        return MapToDto(reservation, listingId: listingId);
    }

    public async Task<ReservationDto> AcknowledgeAsync(
        Guid reservationId,
        Guid callerId,
        CancellationToken ct = default
    )
    {
        var r =
            await _reservations.GetByIdTrackedAsync(reservationId, ct)
            ?? throw new ReservationException(ReservationErrors.NotFound);

        ReservationStateMachine.Acknowledge(r, callerId, _clock.GetUtcNow().UtcDateTime);
        await _reservations.SaveAsync(ct);
        if (callerId == r.SellerId)
        {
            await _chat.SendSystemAsync(
                reservationId,
                "This reservation was accepted by the seller.",
                ct
            );
        }
        else
        {
            await _chat.SendSystemAsync(
                reservationId,
                "The seller confirmed they can sell this item",
                ct
            );
        }

        var dto = MapToDto(r);
        await _realtime.ReservationUpdatedAsync(dto, ct);
        await _broadcast.BroadCastStatusChange(reservationId, r.ReservationStatus);

        await GuardedPushAsync(
            r.BuyerId,
            NotificationTypes.ReservationStatus,
            "The seller confirmed they can sell this item",
            ct
        );
        return MapToDto(r);
    }

    public async Task<ReservationDto> CancelAsync(
        Guid reservationId,
        Guid callerId,
        CancellationToken ct = default
    )
    {
        var r =
            await _reservations.GetByIdTrackedAsync(reservationId, ct)
            ?? throw new ReservationException(ReservationErrors.NotFound);

        ReservationStateMachine.Cancel(r, callerId, _clock.GetUtcNow().UtcDateTime);

        foreach (var rl in r.ReservationListings)
        {
            await _listings.ReleaseAsync(rl.ListingId, ct);
        }
         
         await _wishlist.RestoreForReservationAsync(reservationId, ct);

        var whoIsThis = callerId == r.BuyerId ? "buyer" : "seller";
        await _chat.SendSystemAsync(
            reservationId,
            $"This reservation was cancelled by the  {whoIsThis}.",
            ct
        );

        await _reservations.SaveAsync(ct);
        foreach (var rl in r.ReservationListings)
        {
            await _listingNotifier.ListingReleasedAsync(rl.ListingId, ct);
        }

        var dto = MapToDto(r, callerId);
        await _realtime.ReservationUpdatedAsync(dto, ct);
        await _broadcast.BroadCastStatusChange(reservationId, r.ReservationStatus);

        var recipient = callerId == r.BuyerId ? r.SellerId : r.BuyerId;
        await GuardedPushAsync(
            recipient,
            NotificationTypes.ReservationStatus,
            $"The {whoIsThis} cancelled the reservation.",
            ct
        );
        return MapToDto(r, callerId);
    }

    public async Task<IReadOnlyList<ReservationListItemDto>> ListForUserAsync(
        Guid userId,
        string role,
        CancellationToken ct = default
    )
    {
        var reservations =
            role == "buyer"
                ? await _reservations.ListForBuyerAsync(userId, ct)
                : await _reservations.ListForSellerAsync(userId, ct);

        if (reservations.Count == 0)
        {
            return Array.Empty<ReservationListItemDto>();
        }

        var ids = reservations.Select(r => r.ReservationId);

        var unread = await _chat.GetUnreadCountsAsync(ids, userId, ct);
        var lastMessages = await _chat.GetLastMessagesAsync(ids, ct);
        return reservations
            .Select(r =>
            {
                var lastMsg = lastMessages.GetValueOrDefault(r.ReservationId);
                var isBuyer = r.BuyerId == userId;
                var listing = r.ReservationListings.First().Listing;
                var other = isBuyer ? r.Seller : r.Buyer;

                return new ReservationListItemDto(
                    ReservationId: r.ReservationId,
                    ReservationStatus: r.ReservationStatus,
                    TimerStage: ReservationStateMachine.DeriveTimerStage(r),
                    ExpiresAt: r.ExpiresAt,
                    CreatedAt: r.CreatedAt,
                    CounterParty: new CounterPartyDto(
                        other!.UserId,
                        $"{other.FirstName} {other.LastName}",
                        $"{other.FirstName[0]}{other.LastName[0]}"
                    ),
                    Listing: new ReservationListingSummaryDto(
                        listing.ListingId,
                        listing.Title,
                        listing.Price,
                        listing.Images.Count > 0
                            ? $"/api/listings/{listing.ListingId}/images/{listing.Images.First().ImageId}"
                            : null
                    ),
                    UnreadCount: unread.GetValueOrDefault(r.ReservationId, 0),
                    LastMessagePreview: lastMsg.Content,
                    LastMessageAt: lastMsg.SentAt == default ? (DateTime?)null : lastMsg.SentAt
                );
            })
            .ToList();
    }

    public async Task<ReservationDto?> GetByIdAsync(
        Guid reservationId,
        Guid callerId,
        CancellationToken ct = default
    )
    {
        var r = await _reservations.GetByIdAsync(reservationId, ct);
        if (r is null)
            return null;
        if (r.BuyerId != callerId && r.SellerId != callerId)
        {
            throw new ReservationException(ReservationErrors.Forbidden);
        }
        return MapToDto(r, callerId);
    }

    private static ReservationDto MapToDto(
        Reservation r,
        Guid? callerId = null,
        Guid? listingId = null
    )
    {
        CounterPartyDto? counterParty = null;

        if (callerId.HasValue)
        {
            var isBuyer = r.BuyerId == callerId.Value;
            var other = isBuyer ? r.Seller : r.Buyer;

            if (other is not null)
            {
                counterParty = new CounterPartyDto(
                    other.UserId,
                    $"{other.FirstName} {other.LastName}",
                    $"{other.FirstName[0]}{other.LastName[0]}"
                );
            }
        }

        return new ReservationDto(
            ReservationId: r.ReservationId,
            ListingId: listingId ?? r.ReservationListings.First().ListingId,
            BuyerId: r.BuyerId,
            SellerId: r.SellerId,
            ReservationStatus: r.ReservationStatus,
            TimerStage: ReservationStateMachine.DeriveTimerStage(r),
            ExpiresAt: r.ExpiresAt,
            CreatedAt: r.CreatedAt,
            CompletedAt: r.CompletedAt,
            CounterParty: counterParty
        );
    }

    public async Task<IReadOnlyList<ReservationDto>> ExpireDueAsync(
        DateTime asOf,
        CancellationToken ct = default
    )
    {
        var reservationsThatShouldExpire = await _reservations.GetDueForExpiryAsync(
            asOf,
            batchSize: 100,
            ct
        );
        var expired = new List<ReservationDto>();

        foreach (var reservation in reservationsThatShouldExpire)
        {
            ReservationStateMachine.Expire(reservation, asOf);

            foreach (var rl in reservation.ReservationListings)
            {
                await _listings.ReleaseAsync(rl.ListingId, ct);
            }

            await _wishlist.RestoreForReservationAsync(reservation.ReservationId, ct);

            await _chat.SendSystemAsync(reservation.ReservationId, "This reservation expired", ct);
            expired.Add(MapToDto(reservation));
        }

        await _reservations.SaveAsync(ct);

        foreach (var reservation in reservationsThatShouldExpire)
        {
            await _chat.SendSystemAsync(reservation.ReservationId, "This reservation expired", ct);
            await _realtime.ReservationUpdatedAsync(MapToDto(reservation), ct);
            foreach (var rl in reservation.ReservationListings)
            {
                await _listingNotifier.ListingReleasedAsync(rl.ListingId, ct);
            }
        }
        return expired;
    }

    public Task<bool> IsPartyToAsync(
        Guid reservationId,
        Guid userId,
        CancellationToken ct = default
    ) => _reservations.IsPartyToAsync(reservationId, userId, ct);

    private async Task GuardedPushAsync(
        Guid userId,
        string type,
        string message,
        CancellationToken ct
    )
    {
        try
        {
            await _pushNotifier.NotifyAsync(userId, type, message, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Push failed for user {UserId}, type {Type}", userId, type);
        }
    }

    public async Task<IReadOnlyList<ReservationDto>> SendTwoHourWarningsAsync(
        DateTime asOfTime,
        CancellationToken ct
    )
    {
        var dueReservations = await _reservations.GetDueForTwoHourWarningAsync(asOfTime, 100, ct);
        var dueCount = dueReservations.Count;

        if (dueCount == 0)
        {
            return Array.Empty<ReservationDto>();
        }

        foreach (var reservation in dueReservations)
        {
            reservation.TwoHourWarningSentAt = asOfTime;
        }
        await _reservations.SaveAsync(ct);

        var results = new List<ReservationDto>();
        foreach (var reservation in dueReservations)
        {
            await GuardedPushAsync(
                reservation.BuyerId,
                NotificationTypes.ReservationStatus,
                "Your reservation expires in about 2 hours.",
                ct
            );
            await GuardedPushAsync(
                reservation.SellerId,
                NotificationTypes.ReservationStatus,
                "A reservation in your listing expires in about 2 hours.",
                ct
            );
            results.Add(MapToDto(reservation));
        }
        return results;
    }
}
