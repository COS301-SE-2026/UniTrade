namespace Modules.Identity.Models.DTO
{
    public class StudentDto
    {
        public string? VerificationStatus { get; set; }
        public int YearOfStudy { get; set; }

        public string DegreeProgram { get; set; } = null!;
        public string University { get; set; } = null!;
    }
}
