namespace Modules.Audit.Models.Dto;

public class AuditEntryDto
{
    public long LogId { get; set; }
    public Guid? ActorId { get; set; }
    public string Action { get; set; } = null!;
    public string EntityType { get; set; } = null!;
    public string EntityId { get; set; } = null!;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string? Reason { get; set; }
    public DateTime Timestamp { get; set; }
}
