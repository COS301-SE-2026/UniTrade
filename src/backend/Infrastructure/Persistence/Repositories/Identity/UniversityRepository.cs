
using Microsoft.EntityFrameworkCore;
using Modules.ReferenceData.University;
using Infrastructure.Persistence;

namespace Infrastructure.Persistence.Repositories;

public class UniversityRepository : IUniversityRepository
{
    private readonly AppDbContext _context;
    public UniversityRepository(AppDbContext context)
    {
        _context = context;
    }
    public async Task<University?> GetByDomainAsync(string domain)
    {
        return await _context.Universities.FirstOrDefaultAsync(x => x.EmailDomain == domain);
    }
}