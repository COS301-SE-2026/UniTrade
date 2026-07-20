using System.Text.Json;
using Microsoft.Extensions.Logging;
using Modules.Chat;
using Modules.Chat.Models.Dto;
using Modules.Chat.Repository;
using Modules.Notifications;
using Modules.Reservations.Models;
using Modules.Reservations.Models.Dto;
using Modules.Reservations.Repositories;
using Modules.Reservations.StateMachine;

namespace Modules.Reservations;

public class MeetupService : IMeetupService
{
    private readonly IReservationRepository _reservations;
    private readonly IMeetupRepository _meetups;
    private readonly IChatService _chat;
    private readonly INotificationDispatcher _pushNotifier;
    private readonly ILogger<MeetupService> _logger;
    private readonly TimeProvider _clock;

    public MeetupService(
        IReservationRepository reservations,
        IChatService chat,
        TimeProvider clock,
        IMeetupRepository meetups,
        INotificationDispatcher pushNotifier,
        ILogger<MeetupService> logger
    )
    {
        _reservations = reservations;
        _meetups = meetups;
        _chat = chat;
        _pushNotifier = pushNotifier;
        _logger = logger;
        _clock = clock;
    }

    public async Task<ChatMessageDto> ProposeAsync(
        Guid reservationId,
        Guid callerId,
        MeetupProposalPayload payload,
        CancellationToken ct = default
    )
    {
        var r =
            await _reservations.GetByIdAsync(reservationId, ct)
            ?? throw new ReservationException(ReservationErrors.NotFound);

        Guard(r, callerId);

        if (payload.ProposedTime <= _clock.GetUtcNow().UtcDateTime)
        {
            throw new ReservationException(ReservationErrors.TimeInPast);
        }

        var recipient = callerId == r.BuyerId ? r.SellerId : r.BuyerId;
        await GuardedPushAsync(
            recipient,
            NotificationTypes.ReservationStatus,
            $"TMeetup propose at {payload.LocationName}, {payload.ProposedTime:ddd d MMM HH:mm}",
            ct
        );

        return await _chat.SendMeetupProposalAsync(reservationId, callerId, payload, ct);
    }

    private static void Guard(Reservation r, Guid callerId)
    {
        if (r.BuyerId != callerId && r.SellerId != callerId)
        {
            throw new ReservationException(ReservationErrors.Forbidden);
        }
        if (r.ReservationStatus != ReservationState.Active)
        {
            throw new ReservationException(ReservationErrors.NotActive);
        }
    }

    public async Task<MeetupResponseResult> AcceptAsync(
        Guid reservationId,
        Guid callerId,
        int proposalMessageId,
        CancellationToken ct = default
    )
    {
        var r =
            await _reservations.GetByIdTrackedAsync(reservationId, ct)
            ?? throw new ReservationException(ReservationErrors.NotFound);

        Guard(r, callerId);

        var proposal =
            await _chat.GetMessageAsync(reservationId, proposalMessageId, ct)
            ?? throw new ReservationException(ReservationErrors.ProposalNotFound);

        if (proposal.MessageType != "meetup_proposal")
        {
            throw new ReservationException(ReservationErrors.NotAProposal);
        }
        if (proposal.SenderId == callerId)
        {
            throw new ReservationException(ReservationErrors.CannotAcceptOwnProposal);
        }
        if (await _chat.HasResponseForProposalAsync(reservationId, proposalMessageId, ct))
        {
            throw new ReservationException(ReservationErrors.AlreadyResponded);
        }

        var meetupProposalPayload =
            proposal.Payload!.Value.Deserialize<MeetupProposalPayload>()
            ?? throw new ReservationException(ReservationErrors.NotAProposal);

        var details = meetupProposalPayload;

        var now = _clock.GetUtcNow().UtcDateTime;

        var meetup = new Meetup
        {
            ReservationId = reservationId,
            AgreedLocationName = details.LocationName,
            AgreedLatitude = details.Lat,
            AgreedLongitude = details.Lng,
            AgreedTime = details.ProposedTime,
            CheckinWindowClosesAt =
                details.ProposedTime + ReservationStateMachine.CheckinWindowAfterMeetup,
            Status = "scheduled",
        };

        var proposer = proposal.SenderId!.Value;
        await GuardedPushAsync(
            proposer,
            NotificationTypes.ReservationStatus,
            $"Meetup confirmed - {details.ProposedTime:ddd d MMM HH:mm} at {details.LocationName}.",
            ct
        );
        await _meetups.AddAsync(meetup, ct);

        ReservationStateMachine.ConfirmMeetup(r, now);

        var responsePayload = new MeetupResponsePayload(
            Accepted: true,
            ProposalMessageId: proposalMessageId,
            LocationName: details.LocationName,
            Lat: details.Lat,
            Lng: details.Lng,
            ProposedTime: details.ProposedTime
        );

        var responseMessage = await _chat.SendMeetupResponseAsync(
            reservationId,
            callerId,
            responsePayload,
            ct
        );

        await _reservations.SaveAsync(ct);

        return new MeetupResponseResult(
            ResponseMessage: responseMessage,
            MeetupId: meetup.MeetupId,
            Reservation: MapToDto(r)
        );
    }

    public async Task<CheckInResult> CheckInAsync(
        Guid reservationId,
        Guid callerId,
        decimal? lat,
        decimal? lng,
        CancellationToken ct = default
    )
    {
        var r =
            await _reservations.GetByIdAsync(reservationId, ct)
            ?? throw new ReservationException(ReservationErrors.MeetupNotFound);

        Guard(r, callerId);

        var meetup =
            await _meetups.GetActiveByReservationAsync(reservationId, ct)
            ?? throw new ReservationException(ReservationErrors.MeetupNotFound);

        var now = _clock.GetUtcNow().UtcDateTime;
        var isBuyer = r.BuyerId == callerId;

        var verified = isBuyer
            ? MeetupStateMachine.CheckInBuyer(meetup, now, lat, lng)
            : MeetupStateMachine.CheckInSeller(meetup, now, lat, lng);

        await _meetups.SaveAsync(ct);

        var paymentUnlocked = isBuyer && MeetupStateMachine.IsPaymentUnlocked(meetup);
        var message = verified
            ? "Checked in."
            : "Checked in. Note: without location, you won't be able to prove you were at the meetup if there's a dispute.";

        // still have to broadcast over the hub so the other party sees they've arrived and the pay button unlock w/o needing a refresh
        return new CheckInResult(
            MeetupId: meetup.MeetupId,
            CheckedIn: true,
            LocationVerified: verified,
            CheckInAt: isBuyer ? meetup.BuyerCheckinTime!.Value : meetup.SellerCheckinTime!.Value,
            PaymentUnlocked: paymentUnlocked,
            Message: message
        );
    }

    public async Task<MeetupStatusDto?> GetMeetupStatusAsync(
        Guid reservationId,
        Guid callerId,
        CancellationToken ct = default
    )
    {
        var r =
            await _reservations.GetByIdAsync(reservationId, ct)
            ?? throw new ReservationException(ReservationErrors.MeetupNotFound);
        if (r.BuyerId != callerId && r.SellerId != callerId)
        {
            throw new ReservationException(ReservationErrors.Forbidden);
        }

        var meetup = await _meetups.GetActiveByReservationAsync(reservationId, ct);
        if (meetup is null)
        {
            return null;
        }

        var now = _clock.GetUtcNow().UtcDateTime;

        return new MeetupStatusDto(
            MeetupId: meetup.MeetupId,
            AgreedLocationName: meetup.AgreedLocationName,
            AgreedTime: meetup.AgreedTime,
            CheckinWindowClosesAt: meetup.CheckinWindowClosesAt,
            CheckInWindowOpen: MeetupStateMachine.IsCheckInWindowOpen(meetup, now),
            BuyerCheckedIn: meetup.BuyerCheckedIn,
            SellerCheckedIn: meetup.SellerCheckedIn,
            PaymentUnlocked: MeetupStateMachine.IsPaymentUnlocked(meetup),
            Status: meetup.Status
        );
    }

    public async Task<ChatMessageDto> DeclineAsync(
        Guid reservationId,
        Guid callerId,
        int proposalMessageId,
        CancellationToken ct = default
    )
    {
        var reservation =
            await _reservations.GetByIdAsync(reservationId, ct)
            ?? throw new ReservationException(ReservationErrors.NotFound);

        Guard(reservation, callerId);

        var proposalMade =
            await _chat.GetMessageAsync(reservationId, proposalMessageId, ct)
            ?? throw new ReservationException(ReservationErrors.ProposalNotFound);

        if (proposalMade.MessageType != "meetup_proposal")
        {
            throw new ReservationException(ReservationErrors.NotAProposal);
        }

        if (proposalMade.SenderId == callerId)
        {
            throw new ReservationException(ReservationErrors.CannotAcceptOwnProposal);
        }

        if (await _chat.HasResponseForProposalAsync(reservationId, proposalMessageId, ct))
        {
            throw new ReservationException(ReservationErrors.AlreadyResponded);
        }

        var payload = new MeetupResponsePayload(
            Accepted: false,
            ProposalMessageId: proposalMessageId
        );

        var response = await _chat.SendMeetupResponseAsync(reservationId, callerId, payload, ct);
        await GuardedPushAsync(
            proposalMade.SenderId!.Value,
            NotificationTypes.ReservationStatus,
            "Your meetup proposal was declined.",
            ct
        );
        return response;
    }

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

    private static ReservationDto MapToDto(Reservation r, Guid? listingId = null) =>
        new(
            ReservationId: r.ReservationId,
            ListingId: listingId ?? r.ReservationListings.First().ListingId,
            BuyerId: r.BuyerId,
            SellerId: r.SellerId,
            ReservationStatus: r.ReservationStatus,
            TimerStage: ReservationStateMachine.DeriveTimerStage(r),
            ExpiresAt: r.ExpiresAt,
            CreatedAt: r.CreatedAt,
            CounterParty: null
        );
}
