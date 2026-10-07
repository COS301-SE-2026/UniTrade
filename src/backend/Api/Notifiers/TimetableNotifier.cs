using Api.Hubs;
using Microsoft.AspNetCore.SignalR;
using Modules.Timetable;

namespace Api.Notifiers;

public sealed class TimetableNotifier : ITimetableNotifier
{
    private readonly IHubContext<ChatHub> _hub;

    public TimetableNotifier(IHubContext<ChatHub> hub) => _hub = hub;

    public Task TimetableUpdatedAsync(Guid userId, CancellationToken ct = default) =>
        _hub.Clients.All.SendAsync("timetable_updated", new { userId = userId.ToString() }, ct);
}
