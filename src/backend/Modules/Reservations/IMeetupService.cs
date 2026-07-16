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
}
