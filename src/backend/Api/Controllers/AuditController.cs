using Microsoft.AspNetCore.Mvc;
using Modules.Audit;
using Modules.Audit.Models.Dto;

namespace Api.Controllers;

[Route("api/admin/audit")]
public sealed class AuditController : AdminControllerBase
{
    private readonly IAuditService _auditService;

    public AuditController(IAuditService auditService) => _auditService = auditService;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AuditEntryDto>>> Get(
        [FromQuery] Guid? entityId,
        [FromQuery] Guid? actorId,
        CancellationToken ct
    )
    {
        var auditLogs = await _auditService.GetAsync(entityId?.ToString(), actorId, ct);

        return Ok(
            auditLogs.Select(a => new AuditEntryDto
            {
                LogId = a.LogId,
                ActorId = a.ActorId,
                Action = a.Action,
                EntityType = a.EntityType,
                EntityId = a.EntityId,
                OldValue = a.OldValue,
                NewValue = a.NewValue,
                Reason = a.Reason,
                Timestamp = a.CreatedAt,
            })
        );
    }
}
