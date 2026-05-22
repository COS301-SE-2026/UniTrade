namespace Modules.ReferenceData.University;

public class University
{
    public int UniversityId { get; set; }
    public string Name { get; set; } = null!;
    public string EmailDomain { get; set; } = null!;
    public bool IsActive { get; set; } = true;


}