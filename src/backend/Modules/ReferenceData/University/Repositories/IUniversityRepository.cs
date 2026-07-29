namespace Modules.ReferenceData.University.Repositories;

public interface IUniversityRepository
{
    Task<University?> GetByDomainAsync(string domain);
    Task<List<University>> GetActiveAsync();
}
