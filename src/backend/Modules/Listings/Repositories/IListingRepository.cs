using Microsoft.EntityFrameworkCore;
using Modules.Listings.Models;
using Modules.Listings.Models.Dto;

namespace Modules.Listings.Repositories;

public interface IListingRepository
{
    Task<Listing?> GetByIdAsync(Guid listingId);
    Task<(IReadOnlyList<Listing> listings, int Total)> ListAsync(ListFilterDto listingFilterDto);
}
