//using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Modules.ReferenceData.University;
using Modules.ReferenceData.University.Repositories;

//using Modules.Identity.Models.DTO;

namespace Modules.ReferenceData;

public class UniversityService : IUniversityService
{
    private readonly IUniversityRepository _universities;

    public UniversityService(IUniversityRepository universities)
    {
        _universities = universities;
    }

    public async Task<List<Modules.Identity.Models.DTO.University>> GetActiveUniversitiesAsync()
    {
        var results = await _universities.GetActiveAsync();

        return results
            .Select(u => new Modules.Identity.Models.DTO.University
            {
                University_ID = u.UniversityId,
                Name = u.Name,
                Email_domain = u.EmailDomain,
                Is_Active = u.IsActive,
            })
            .ToList();
    }

    //getdomain???(its still in the db repo)
}
