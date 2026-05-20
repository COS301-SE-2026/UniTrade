using Modules.Persistence;
using Modules.Listings.Repositories;

namespace Infrastructure.Persistence.Repositories;

public class ListingsRepository : IListingsRepository
{
    private readonly AppDbContext _dbContext;
    private readonly ListingsService _listingsService;

    public ListingsRepository(AppDbContext dbContext, ListingsService listingsService)
    {
        _dbContext=dbContext;
        _listingsService=listingsService;
    }

    public async Task AddAsync(ListingsModel listings)
    {

    }
    public async Task UpdateAsync(ListingsModel listings,Guid id)
    {

    }
    public async Task<User?> DeleteByIdAsync(Guid id)
    {

    }
}