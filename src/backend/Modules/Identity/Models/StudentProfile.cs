using System.Reflection.Metadata;
using Modules.ReferenceData.University;
namespace Modules.Identity.Models;

public class StudentProfile
{
    public Guid StudentId { get; set; }
    public string? StudentNumber { get; set; }
    public int UniversityId { get; set; }
    public int? CourseId { get; set; }
    public int YearOfStudy { get; set; }
    public string VerificationStatus { get; set; } = "pending";
    public decimal ReputationScore { get; set; }
    public string? DegreeProgram {get; set;}
    public University University {get; set; }= null!;
    public User User { get; set; } = null!;
}
