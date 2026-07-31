using System.Text.Json;

namespace Modules.Chat.Models.Dto;

public record ChatMessageDto(
    int MessageId,
    Guid ReservationId,
    Guid? SenderId,
    string MessageType,
    string Content,
    JsonElement? Payload,
    DateTime SentAt,
    DateTime? ReadAt,
    string? ClientKey
);
