namespace Modules.Identity.Models.Dto;

public class UpdateProfileDto
{
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;

    public int YearOfStudy { get; set; }
    public string DegreeProgram { get; set; } = null!;
}
