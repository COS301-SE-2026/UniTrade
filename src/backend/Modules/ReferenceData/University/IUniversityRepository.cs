namespace Modules.ReferenceData.University;

public interface IUniversityRepository
{
    Task<University?> GetByDomainAsync(string domain);
    Task<List<University>> GetActiveAsync();
}