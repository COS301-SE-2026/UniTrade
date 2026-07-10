using System.Text.Json;

namespace Modules.Chat.Models.Dto;

public record ChatMessageDto(
    int MessageId,
    Guid ReservationId,
    Guid? SenderId,
    string MessageType,
    string content,
    JsonElement? PayLoad,
    DateTime SentAt,
    DateTime? ReadAt
);
