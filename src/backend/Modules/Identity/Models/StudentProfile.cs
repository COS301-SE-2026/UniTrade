namespace Modules.Identity.Models;

public class StudentProfile
{
    public Guid StudentId { get; set; }
    public Guid UserId { get; set; }
    public string? StudentNumber { get; set; }
    public int UniversityId { get; set; }
    public int CourseId { get; set; }
    public int YearOfStudy { get; set; }
    public string VerificationStatus { get; set; } = "pending";
    public decimal ReputationScore { get; set; }

}