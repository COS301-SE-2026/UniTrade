using Modules.Chat.Models.Dto;
using Modules.Reservations.Models.Dto;

namespace Modules.Reservations;

public interface IMeetupService
{
    Task<ChatMessageDto> ProposeAsync(
        Guid reservationId,
        Guid callerId,
        MeetupProposalPayload payload,
        CancellationToken ct = default
    );

    Task<MeetupResponseResult> AcceptAsync(
        Guid reservationId,
        Guid callerId,
        int proposalMessageId,
        CancellationToken ct = default
    );

    Task<CheckInResult> CheckInAsync(
        Guid reservationId,
        Guid callerId,
        decimal? lat,
        decimal? lng,
        CancellationToken ct = default
    );

    Task<MeetupStatusDto?> GetMeetupStatusAsync(
        Guid reservationId,
        Guid callerId,
        CancellationToken ct = default
    );

    Task<ChatMessageDto> DeclineAsync(
        Guid reservationId,
        Guid callerId,
        int proposalMessageId,
        CancellationToken ct = default
    );
}
