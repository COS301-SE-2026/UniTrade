using Modules.Chat;
using Modules.Listings.Repositories;
using Modules.Reservations.Models;
using Modules.Reservations.Models.Dto;
using Modules.Reservations.Repositories;
using Modules.Reservations.StateMachine;

namespace Modules.Reservations;

public class ReservationService : IReservationService
{
    private readonly IListingRepository _listings;
    private readonly IReservationRepository _reservations;
    private readonly IChatService _chat;
    private readonly TimeProvider _clock;

    public ReservationService(
        IReservationRepository reservations,
        IListingRepository listings,
        IChatService chat,
        TimeProvider clock
    )
    {
        _reservations = reservations;
        _listings = listings;
        _chat = chat;
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

        await _chat.SendSystemAsync(
            reservationId,
            "The seller confirmed they can sell this item",
            ct
        );
        await _reservations.SaveAsync(ct);

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
        return MapToDto(r);
    }

    public async Task<IReadOnlyList<ReservationListItemDto>> ListForUserAsync(
        Guid userId,
        string role,
        CancellationToken ct = default
    )
    {
        return null;
    }

    public async Task<ReservationDto?> GetByIdAsync(
        Guid reservationId,
        Guid callerId,
        CancellationToken ct = default
    )
    {
        return null;
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
