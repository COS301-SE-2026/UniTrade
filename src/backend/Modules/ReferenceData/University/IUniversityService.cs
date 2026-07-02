//using Modules.Identity.Models.DTO;//the dto can be found here,if err just take out .Dto(i think)

namespace Modules.ReferenceData.University;
public interface IUniversityService
{
    //Task<University?> GetByDomainAsync(string domain);

    Task<List<Modules.Identity.Models.DTO.University>> GetActiveUniversitiesAsync();
}