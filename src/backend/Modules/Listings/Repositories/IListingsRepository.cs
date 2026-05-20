using Modules.Listings;
using Modules.Listings.Models;

namespace Modules.Listings.Repositories;

public interface IListingsRepository
{
    Task AddAsync(Listing listings);
    Task UpdateAsync(Listing listings,Guid id);
    Task<Listing> DeleteByIdAsync(Guid id);
    Task<Listing> GetUserId(Guid id);

}