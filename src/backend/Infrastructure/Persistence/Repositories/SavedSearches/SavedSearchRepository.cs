using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Modules.Listings;
using Modules.Listings.Models;
using Modules.SavedSearches.Models;
using Modules.SavedSearches.Repositories;

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

    public async Task<IReadOnlyList<SavedSearch>> GetByBuyerAsync(
        Guid buyerId,
        CancellationToken ct = default
    )
    {
        return await _db
            .SavedSearches.Where(s => s.BuyerId == buyerId && s.IsActive)
            .ToListAsync(ct);
    }

    public async Task<SavedSearch> GetByIdAsync(Guid searchId, CancellationToken ct = default)
    {
        return await _db.SavedSearches.FirstOrDefaultAsync(s => s.SearchId == searchId, ct);
    }

    public async Task<IReadOnlyList<SavedSearch>> GetCandidatesForListingAsync(
        ListingPublishedEvent listingEvent,
        CancellationToken ct = default
    )
    {
        var query = _db.SavedSearches.Where(s => s.IsActive);
        query = query.Where(s => s.BuyerId != listingEvent.SellerId);

        if (listingEvent.CategoryId.HasValue)
            query = query.Where(s =>
                s.CategoryId == null || s.CategoryId == listingEvent.CategoryId
            );

        if (listingEvent.CourseId.HasValue)
            query = query.Where(s => s.CourseId == null || s.CourseId == listingEvent.CourseId);

        query = query.Where(s =>
            (s.MinPrice == null || listingEvent.Price >= s.MinPrice)
            && (s.MaxPrice == null || listingEvent.Price <= s.MaxPrice)
        );

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

    public async Task<IReadOnlyList<Listing>> GetMatchingListingsAsync(
        SavedSearch search,
        CancellationToken ct
    )
    {
        var query = _db
            .Listings.Where(l => l.ListingStatus == "live")
            .Include(l => l.Category)
            .Include(l => l.Images)
            .AsQueryable();

        if (search.CategoryId.HasValue)
        {
            query = query.Where(l => l.CategoryId == search.CategoryId.Value);
        }

        if (search.CourseId.HasValue)
        {
            query = query.Where(l => l.CourseId == search.CourseId.Value);
        }

        if (search.MinPrice.HasValue)
        {
            query = query.Where(l => l.Price >= search.MinPrice.Value);
        }

        if (search.MaxPrice.HasValue)
        {
            query = query.Where(l => l.Price <= search.MaxPrice.Value);
        }

        var candidates = await query.ToListAsync(ct);

        var words = search
            .Query.ToLowerInvariant()
            .Split(' ', StringSplitOptions.RemoveEmptyEntries);

        var matching = candidates
            .Where(l =>
            {
                var text = $"{l.Title} {l.Description ?? ""}".ToLowerInvariant();

                return words.All(w => text.Contains(w));
            })
            .OrderByDescending(l => l.CreatedAt)
            .ToList();
        return matching;
    }
}
