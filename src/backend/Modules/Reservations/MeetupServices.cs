using Modules.Chat.Models.Dto;
using Modules.Chat.Repository;
using Modules.Reservations.Repositories;

namespace Modules.Reservations;

public class MeetupService : IMeetupService
{
    private readonly IReservationRepository _reservations;
    private readonly IChatRepository _chat;

    public MeetupService(IReservationRepository reservations, IChatRepository chat)
    {
        _reservations = reservations;
        _chat = chat;
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
}
