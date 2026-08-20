using Modules.Audit.Models;

namespace Modules.Audit;

public interface IAuditService
{
    Task WriteAsync(
        Guid? actorId,
        string action,
        string entityType,
        string EntityId,
        string? oldValue,
        string? newValue,
        string? reason,
        CancellationToken ct = default
    );

    Task<IReadOnlyList<AuditLog>> GetAsync(
        string? entityId,
        Guid? actorId,
        CancellationToken ct = default
    );
}
