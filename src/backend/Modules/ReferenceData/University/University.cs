namespace Modules.ReferenceData.University;

public class University
{
    public int UniversityId { get; set; }
    public string Name { get; set; } = null!;
    public bool IsActive { get; set; } = true;

    public ICollection<UniversityEmailDomain> EmailDomains { get; set; } = new List<UniversityEmailDomain>();

}
