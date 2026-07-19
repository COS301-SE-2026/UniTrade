using Modules.Chat.Models.Dto;

namespace Modules.Chat;

public interface IChatNotifier
{
    Task MessageCreatedAsync(
        ChatMessageDto message,
        IEnumerable<Guid> recipientIds,
        CancellationToken ct = default
    );
}
