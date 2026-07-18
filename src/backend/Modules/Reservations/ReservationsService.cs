using Modules.Chat;
using Modules.Listings.Repositories;
using Modules.Reservations.Models;
using Modules.Reservations.Models.Dto;
using Modules.Reservations.Repositories;
using Modules.Reservations.StateMachine;
using Modules.Wishlist;

namespace Modules.Reservations;

public class ReservationService : IReservationService
{
    private readonly IListingRepository _listings;
    private readonly IReservationRepository _reservations;
    private readonly IChatService _chat;
    private readonly IBroadCastService _broadcast;
    private readonly IWishlistService _wishlist;
    private readonly TimeProvider _clock;

    public ReservationService(
        IReservationRepository reservations,
        IListingRepository listings,
        IChatService chat,
        IBroadCastService broadcast,
        IWishlistService wishlist,
        TimeProvider clock
    )
    {
        _reservations = reservations;
        _listings = listings;
        _chat = chat;
        _broadcast = broadcast;
        _wishlist = wishlist;
        _clock = clock;
    }

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

        await _chat.SendSystemAsync(
            reservation.ReservationId,
            $"A buyer is interested in \"{listing.Title}\".",
            ct
        );
        await _reservations.SaveAsync(ct);
        await _wishlist.CleanForListingAsync(listingId, ct);

        return MapToDto(reservation, listingId);
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

        if (callerId==r.SellerId)
        {
            await _chat.SendSystemAsync(
                reservationId,
                "You have accepted this reservation request",
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

        await _reservations.SaveAsync(ct);

        await _broadcast.BroadCastStatusChange(reservationId, r.ReservationStatus);

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

        var whoIsThis = callerId == r.BuyerId ? "buyer" : "seller";
        await _chat.SendSystemAsync(
            reservationId,
            $"This reservation was cancelled by the  {whoIsThis}.",
            ct
        );

        await _reservations.SaveAsync(ct);
        await _broadcast.BroadCastStatusChange(reservationId, r.ReservationStatus);

        return MapToDto(r);
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
        return MapToDto(r);
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

            await _chat.SendSystemAsync(reservation.ReservationId, "This reservation expired", ct);
            expired.Add(MapToDto(reservation));
        }
        await _reservations.SaveAsync(ct);
        return expired;
    }

    public Task<bool> IsPartyToAsync(
        Guid reservationId,
        Guid userId,
        CancellationToken ct = default
    ) => _reservations.IsPartyToAsync(reservationId, userId, ct);

    private static ReservationDto MapToDto(Reservation r, Guid? listingId = null) =>
        new(
            ReservationId: r.ReservationId,
            ListingId: listingId ?? r.ReservationListings.First().ListingId,
            BuyerId: r.BuyerId,
            SellerId: r.SellerId,
            ReservationStatus: r.ReservationStatus,
            TimerStage: ReservationStateMachine.DeriveTimerStage(r),
            ExpiresAt: r.ExpiresAt,
            CreatedAt: r.CreatedAt
        );
}
