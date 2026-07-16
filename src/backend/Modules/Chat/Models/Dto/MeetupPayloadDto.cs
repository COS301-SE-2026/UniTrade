namespace Modules.Chat.Models.Dto;
public record MeetupProposalPayload(
    string LocationName,
    decimal Lat,
    decimal Lng,
    DateTime ProposedTime
);
