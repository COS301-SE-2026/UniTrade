namespace Modules.Chat.Models.Dto;

public record ChatHistoryDto(IReadOnlyList<ChatMessageDto> Items, bool HasMore);
