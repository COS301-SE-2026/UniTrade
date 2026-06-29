namespace Modules.ReferenceData.University;

using Modules.Identity.Models.Dto;//the dto can be found here,if err just take out .Dto(i think)

public interface IUniversityService
{
    //Task<University?> GetByDomainAsync(string domain);

    Task<List<Modules.Identity.Models.Dto.University>> GetActiveUniversitiesAsync();
}