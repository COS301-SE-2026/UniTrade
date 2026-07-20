using System.Collections.Concurrent;
using Modules.Identity.Models;

namespace Infrastructure.Realtime;

public class ConnectionTracker
{
    private readonly ConcurrentDictionary<Guid, HashSet<string>> _connections = new();
    private readonly Lock _lock = new();

    public void Add(Guid userId, string connectionId)
    {
        var set = _connections.GetOrAdd(userId, _ => []);
        lock (_lock)
            set.Add(connectionId);
    }

    public void Remove(Guid userId, string connectionId)
    {
        if (!_connections.TryGetValue(userId, out var set))
        {
            return;
        }
        lock (_lock)
        {
            set.Remove(connectionId);
            if (set.Count == 0)
            {
                _connections.TryRemove(userId, out _);
            }
        }
    }

    public bool IsOnline(Guid userId) =>
        _connections.TryGetValue(userId, out var set) && set.Count > 0;
}
