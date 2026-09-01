using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Infrastructure.Persistence;
using Modules.SavedSearches.Models;
using Modules.SavedSearches.Repositories;
using Modules.Listings;


namespace Infrastructure.Persistence.SavedSearches;

public class SavedSearchRepository : ISavedSearchRepository
{
    private readonly AppDbContext _db;

    public SavedSearchRepository(AppDbContext db) => _db = db;

    public async Task<SavedSearch> AddAsync(SavedSearch search, CancellationToken ct = default)
    {
        search.SearchId = Guid.NewGuid();
        search.CreatedAt = DateTime.UtcNow;
        _db.SavedSearches.Add(search);
        await _db.SaveChangesAsync(ct);
        return search;
    }

    public async Task<IReadOnlyList<SavedSearch>> GetByBuyerAsync(Guid buyerId, CancellationToken ct = default)
    {
        return await _db.SavedSearches.Where(s => s.BuyerId == buyerId && s.IsActive).ToListAsync(ct);
    }

    public async Task<SavedSearch> GetByIdAsync(Guid searchId, CancellationToken ct = default)
    {
        return await _db.SavedSearches.FirstOrDefaultAsync(s => s.SearchId == searchId, ct);
    }

    public async Task<IReadOnlyList<SavedSearch>> GetCandidatesForListingAsync(ListingPublishedEvent listingEvent, CancellationToken ct = default)
    {
        var query = _db.SavedSearches.Where(s => s.IsActive);
        query = query.Where(s => s.BuyerId != listingEvent.SellerId);

        if (listingEvent.CategoryId.HasValue)
            query = query.Where(s => s.CategoryId == null || s.CategoryId == listingEvent.CategoryId);

        if (listingEvent.CourseId.HasValue)
            query = query.Where(s => s.CourseId == null || s.CourseId == listingEvent.CourseId);

        query = query.Where(s =>
            (s.MinPrice == null || listingEvent.Price >= s.MinPrice) &&
            (s.MaxPrice == null || listingEvent.Price <= s.MaxPrice));

        return await query.ToListAsync(ct);
    }

    public async Task UpdateAsync(SavedSearch search, CancellationToken ct = default)
    {
        _db.SavedSearches.Update(search);
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(Guid searchId, CancellationToken ct = default)
    {
        var search = await GetByIdAsync(searchId, ct);
        if (search is not null)
        {
            search.IsActive = false;
            await UpdateAsync(search, ct);
        }
    }

}
