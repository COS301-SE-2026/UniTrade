namespace Modules.Identity.Models.Dto;

public class RegisterDto
{
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? PhoneNumber { get; set; }
    public string Password { get; set; } = null!;
    public int YearOfStudy { get; set; }
    public int UniversityId { get; set; }
    public string DegreeProgram { get; set; } = null!;
}
