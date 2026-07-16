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
}
