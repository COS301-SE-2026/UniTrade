using Modules.Chat.Models.Dto;

namespace Modules.Reservations.Models.Dto;

public record MeetupResponseResult(
    ChatMessageDto ResponseMessage,
    int? MeetupId, //minimal null now BE2 Thursday work
    ReservationDto Reservation
);
