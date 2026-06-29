//using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Modules.Identity.Models.Dto;
using Modules.ReferenceData.University;

namespace Modules.ReferenceData;

public class UniversityService : IUniversityService
{
    private readonly IUniversityRepository _universities;

    public UniversityService(UniversityRepository universities)
    {
        _universities=universities;
    }

    public async Task<List<University>> GetActiveUniversitiesAsync()
    {
        var results=await _universities.GetActiveAsync();

        return results.Select(u=>new University
        {
            University_ID=u.UniversityID,
            Name=u.Name,
            Email_domain=u.EmailDomain,
            Is_Active=u.IsActive
        }).ToList();
    }

    //getdomain???(its still in the db repo)
}