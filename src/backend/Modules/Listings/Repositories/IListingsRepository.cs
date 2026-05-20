using Modules.Listings;
using Modules.Listings.Models;

namespace Modules.Listings.Repositories;

public interface ListingsRepository
{
    Task AddAsync(ListingsModel listings);
    Task UpdateAsync(ListingsModel listings,Guid id);
    Task<User?> DeleteByIdAsync(Guid id);
    Task<ListingsModel> GetUserId(Guid id);

}