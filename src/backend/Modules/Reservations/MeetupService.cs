using System.Text.Json;
using Modules.Chat;
using Modules.Chat.Models.Dto;
using Modules.Chat.Repository;
using Modules.Reservations.Models;
using Modules.Reservations.Models.Dto;
using Modules.Reservations.Repositories;
using Modules.Reservations.StateMachine;

namespace Modules.Reservations;

public class MeetupService : IMeetupService
{
    private readonly IReservationRepository _reservations;
    private readonly IChatService _chat;
    private readonly TimeProvider _clock;

    public MeetupService(IReservationRepository reservations, IChatService chat, TimeProvider clock)
    {
        _reservations = reservations;
        _chat = chat;
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
            MeetupId: null // be2: day 2
            ,
            Reservation: MapToDto(r)
        );
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
            CreatedAt: r.CreatedAt
        );
}
