using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Modules.ReferenceData;
using Modules.ReferenceData.University;
using Modules.ReferenceData.University.Repositories;

namespace Infrastructure.Persistence.Repositories;

public class UniversityRepository : IUniversityRepository
{
    private readonly AppDbContext _context;

    public UniversityRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<University?> GetByDomainAsync(string domain) =>
        await _context
            .UniversityEmailDomains.Where(d => d.EmailDomain == domain && d.IsActive)
            .Select(d => d.University)
            .FirstOrDefaultAsync();

    public async Task<List<University>> GetActiveAsync()
    {
        return await _context.Universities.Where(u => u.IsActive).ToListAsync();
    }
}
