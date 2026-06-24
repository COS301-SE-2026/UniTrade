namespace Modules.ReferenceData.University;

public interface IUniversityService
{
    Task<University?> GetByDomainAsync(string domain);
}