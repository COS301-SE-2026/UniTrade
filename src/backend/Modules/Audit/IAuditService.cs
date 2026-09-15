using Modules.Audit.Models;

namespace Modules.Audit;

public interface IAuditService
{
    Task WriteAsync(AuditWriteRequest request, CancellationToken ct = default);

    Task<IReadOnlyList<AuditLog>> GetAsync(
        string? entityId,
        Guid? actorId,
        CancellationToken ct = default
    );
}

public sealed record AuditWriteRequest(
    Guid? ActorId,
    string Action,
    string EntityType,
    string EntityId,
    string? OldValue,
    string? NewValue,
    string? Reason
);
