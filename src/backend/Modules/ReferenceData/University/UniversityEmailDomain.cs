namespace Modules.ReferenceData.University;

public class UniversityEmailDomain
{
    public int DomainId { get; set; }
    public int UniversityId { get; set; }
    public string EmailDomain { get; set; } = null!;
    public bool IsActive { get; set; } = true;

    public University University { get; set; } = null!;
}
