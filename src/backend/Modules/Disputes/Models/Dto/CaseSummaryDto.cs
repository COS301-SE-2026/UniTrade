namespace Modules.Disputes.Models.Dto;

public class CaseSummaryDto
{
    public Guid CaseId { get; set; }
    public string Type { get; set; } = null;
    public string Status { get; set; } = null;
    public Guid SubjectUserId { get; set; }
    public DateTime SubmittedAt { get; set; }
    public double AgeHours { get; set; }
}
