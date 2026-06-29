using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Modules.Identity.Models.Dto;

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
            University_ID=u.University_ID,
            Name=u.Name,
            EmailDomain=u.Email_domain,
            Is_Active=u.Is_Active
        }).ToList();
    }
}