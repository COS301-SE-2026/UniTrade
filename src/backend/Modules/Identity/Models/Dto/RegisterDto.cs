

namespace Modules.Identity.Models.Dto;

public class RegisterDto
{
    public Guid UserId { get; set; }
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string PhoneNumber { get; set; } = null!;
    public string Password { get; set; } = null!;
    public int UniversityId { get; set; }
    public string CourseCode { get; set; } = null!;
    public int YearOfStudy { get; set; }

}