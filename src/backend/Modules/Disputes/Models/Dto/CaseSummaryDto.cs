namespace Modules.Disputes.Models.Dto;

public class CaseSummaryDto
{
    public Guid CaseId { get; set; }
    public string Type { get; set; } = null!;
    public string Status { get; set; } = null!;
    public Guid SubjectUserId { get; set; }
    public DateTime SubmittedAt { get; set; }
    public double AgeHours { get; set; }
    public int SlaHours { get; set; }
    public bool SlaBreached { get; set; }
    public string? Title { get; set; }
    public string? SubjectInitials { get; set; }
    public string? CounterpartyInitials { get; set; }
    public Guid RaisedBy { get; set; }
    public Guid? SellerId { get; set; }
    public Guid? BuyerId { get; set; }
    public Guid? ReservationId { get; set; }
    public Guid? ListingId { get; set; }

    public string? SubjectName { get; set; }
    public string? SubjectDegree { get; set; }
    public int? SubjectYear { get; set; }

    public bool HasDocument { get; set; }
}
