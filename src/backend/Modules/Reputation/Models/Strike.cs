namespace Modules.Reputation.Models;

public class Strike
{
    public Guid StrikeId { get; set; }
    public Guid UserId { get; set; }
    public Guid? SourceCaseId { get; set; } //this is nullable vause strikes can be issued without having a case.
    public string Type { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public Guid CreatedByAdminId { get; set; }
    public DateTime CreatedAt { get; set; }
}
