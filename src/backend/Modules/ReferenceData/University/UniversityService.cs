using Modules.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Modules.Identity.Models.Dto;
using Modules.ReferenceData.University;

namespace Modules.ReferenceData;

public class UniversityService : IUniversityService
{
    private readonly UniversityRepository _universities;

    public UniversityService(UniversityRepository universities)
    {
        _universities=universities;
    }

    public async Task<List<University>> GetActiveUniversitiesAsync()
    {
        var results=await _universities.GetActiveAsync();

        return result.Select(u=>new University
        {
            University_ID=u.UniversityID,
            Name=u.Name,
            Email_Domain=u.EmailDomain,
            Is_Active=u.IsActive
        }).ToList();
    }

    //getdomain???(its still in the db repo)
}