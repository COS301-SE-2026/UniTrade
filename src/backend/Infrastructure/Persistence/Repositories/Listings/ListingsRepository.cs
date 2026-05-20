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
        try{
            _dbContext.Listings.Add(listing);
            await _dbContext.Listings.SaveChangesAsync();
        }
        catch(Exception e)
        {
            
        }
    }
    public async Task UpdateAsync(Listings listings,Guid id)
    {
        _dbContext.Listings.Update(id);
        await _dbContext.SaveChangesAsync();
    }

    public async Task<Listings> DeleteByIdAsync(Guid id)
    {
        _dbContext.Listings.Remove(id);
        await _dbContext.SaveChangesAsync();
    }
}