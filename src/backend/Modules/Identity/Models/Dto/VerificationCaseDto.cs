namespace Modules.Identity.Models.Dto;

public class VerificationCaseDto
{
    public Guid VerificationId { get; set; }
    public Guid UserId { get; set; }
    public string Status { get; set; } = null!;
    public string? AdminDecision { get; set; }
    public DateTime SubmittedAt { get; set; }
    public string University { get; set; } = "";
    public string Degree { get; set; } = "";
    public int Year { get; set; }
    public string Email { get; set; } = "";
}
