using Api.Hubs;
using Microsoft.AspNetCore.SignalR;
using Modules.Chat;
using Modules.Chat.Models.Dto;

namespace Api.Notifiers;

public class SignalRChatNotifier(IHubContext<ChatHub> hub) : IChatNotifier
{
    public Task MessageCreatedAsync(
        ChatMessageDto message,
        IEnumerable<Guid> recipientIds,
        CancellationToken ct = default
    ) =>
        hub
            .Clients.Users(recipientIds.Select(id => id.ToString()).ToList())
            .SendAsync("ReceiveMessage", message, ct);
}
