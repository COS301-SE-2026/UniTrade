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
            _dbContext.ListingsModel.Add(listing);
            _dbContext.ListingsModel.SaveChangesAsync();
        }
        catch(Exception e)
        {
            
        }
    }
    public async Task UpdateAsync(Listings listings,Guid id)
    {
        _dbContext.Listings.UpdateAsync(id);
        await _dbContext.SaveChangesAsync();
    }

    public async Task<User?> DeleteByIdAsync(Guid id)
    {
        _dbContext.Listings.Remove(id);
        await _dbContext.SaveChangesAsync();
    }
}