using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Modules.SavedSearches.Models;
using Modules.Listings;

namespace Modules.SavedSearches.Repositories;

public interface ISavedSearchRepository
{
    Task<SavedSearch> AddAsync(SavedSearch search, CancellationToken ct=default);
    Task<IReadOnlyList<SavedSearch>> GetByBuyerAsync(Guid buyerId, CancellationToken ct=default);
    Task<SavedSearch> GetByIdAsync(Guid searchID, CancellationToken ct =default);
    Task<IReadOnlyList<SavedSearch>>GetCandidatesForListingAsync(ListingPublishedEvent listingEvent,CancellationToken ct=default);
    Task UpdateAsync(SavedSearch search, CancellationToken ct=default);
    Task DeleteAsync(Guid searchId, CancellationToken ct=default);

}