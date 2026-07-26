namespace Modules.Chat.Models.Dto;

public record MeetupResponsePayload(
    bool Accepted,
    int ProposalMessageId,
    string? LocationName = null,
    decimal? Lat = null,
    decimal? Lng = null,
    DateTime? ProposedTime = null
);
