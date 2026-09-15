using Modules.Audit.Models;

namespace Modules.Audit.Repositories;

public interface IAuditRepository
{
    Task AddAsync(AuditLog log, CancellationToken ct = default);
    Task<IReadOnlyList<AuditLog>> GetAsync(
        string? id,
        Guid? actorId,
        CancellationToken ct = default
    );
}
