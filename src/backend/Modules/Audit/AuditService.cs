using Microsoft.EntityFrameworkCore.Metadata.Internal;
using Modules.Audit.Models;
using Modules.Audit.Repositories;

namespace Modules.Audit;

public class AuditService : IAuditService
{
    private readonly IAuditRepository _audit;

    public AuditService(IAuditRepository audit)
    {
        _audit = audit;
    }

    public Task WriteAsync(AuditWriteRequest request, CancellationToken ct = default) =>
        _audit.AddAsync(
            new AuditLog
            {
                ActorId = request.ActorId,
                Action = request.Action,
                EntityType = request.EntityType,
                EntityId = request.EntityId,
                OldValue = request.OldValue,
                NewValue = request.NewValue,
                Reason = request.Reason,
            },
            ct
        );

    public Task<IReadOnlyList<AuditLog>> GetAsync(
        string? entityId,
        Guid? actorId,
        CancellationToken ct = default
    ) => _audit.GetAsync(entityId, actorId, ct);
}
