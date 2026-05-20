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
        _dbContext.Listings.Add(listing);
        await _dbContext.Listings.SaveChangesAsync();
    }
    public async Task UpdateAsync(Listings listings,Guid id)
    {
        _dbContext.Listings.Update(id);
        await _dbContext.SaveChangesAsync();
    }

    public async Task DeleteByIdAsync(Guid id)
    {
        var listing = await _dbContext.Listings.FindAsync(id);
            if (listing!=null)
            {
                _dbContext.Listings.Remove(listing);
                await _dbContext.SaveChangesAsync();
            }
    }

    public async Task<ListingsModel> GetByIdAsync(Guid id)
    {
        return await _dbContext.Listings.FindAsync(id);
    }
}