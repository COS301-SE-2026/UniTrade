using Modules.Listings.Repositories;

namespace Modules.Listings.Repositories;

public interface ICategoryService
{
    Task<ListingCategories?> ResolveByNameAsync(string categoryName, CancellationToken ct=default);
}