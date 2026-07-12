using System.Net.Mime;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Modules.Listings.Models;
using Modules.Listings.Models.Dto;
using Modules.Listings.Repositories;

namespace Infrastructure.Persistence.Repositories.Listings;

public class ListingRepository : IListingRepository
{
    private readonly AppDbContext _db;
    private readonly string RemovedStatus = "removed";

    public ListingRepository(AppDbContext db)
    {
        _db = db;
    }

    // for read only purposes
    public async Task<Listing?> GetByIdAsync(Guid listingId)
    {
        var query = _db
            .Listings.AsNoTracking()
            .Include(l => l.Category)
            .Include(l => l.BookDetails)
            .Include(l => l.Images)
            .Where(l => l.ListingStatus != RemovedStatus)
            .Where(l => _db.Users.Any(u => u.UserId == l.SellerId && !u.IsDeleted));

        var listing = await query.FirstOrDefaultAsync(l => l.ListingId == listingId);

        if (listing == null)
        {
            return null;
        }
        await AttachSellerInfoAsync(new[] { listing });

        return listing;
    }

    // for updates
    public async Task<Listing?> GetByIdTrackedAsync(Guid id) =>
        await _db
            .Listings.Include(l => l.Category)
            .Include(l => l.BookDetails)
            .Include(l => l.Images)
            .Where(l => l.ListingStatus != RemovedStatus)
            .Where(l => _db.Users.Any(u => u.UserId == l.SellerId && !u.IsDeleted))
            .FirstOrDefaultAsync(l => l.ListingId == id);

    public async Task<(IReadOnlyList<Listing> listings, int Total)> ListAsync(
        ListFilterDto listingFilterDto
    )
    {
        IQueryable<Listing> query = _db
            .Listings.AsNoTracking()
            .Include(l => l.Category)
            .Include(l => l.BookDetails)
            .Include(l => l.Images);
        query = query.Where(l => l.ListingStatus != RemovedStatus);
        query = query.Where(l => _db.Users.Any(u => u.UserId == l.SellerId && !u.IsDeleted));

        if (listingFilterDto.CategoryId.HasValue)
            query = query.Where(x => x.CategoryId == listingFilterDto.CategoryId);

        if (!string.IsNullOrWhiteSpace(listingFilterDto.ListingStatus))
            query = query.Where(x => x.ListingStatus == listingFilterDto.ListingStatus);

        if (listingFilterDto.CourseId.HasValue)
            query = query.Where(x => x.CourseId == listingFilterDto.CourseId);

        if (listingFilterDto.SellerId.HasValue)
            query = query.Where(x => x.SellerId == listingFilterDto.SellerId);

        if (listingFilterDto.ExcludeSellerId.HasValue)
            query = query.Where(x => x.SellerId != listingFilterDto.ExcludeSellerId);
        if (!string.IsNullOrWhiteSpace(listingFilterDto.Search))
        {
            var searchInput = listingFilterDto.Search.Trim();
            query = query.Where(x =>
                x.Title.Contains(searchInput) || x.Description.Contains(searchInput)
            );
        }

        var total = await query.CountAsync();

        // Map to entity
        var items = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip(listingFilterDto.Skip)
            .Take(listingFilterDto.Take)
            .AsSplitQuery()
            .ToListAsync();

        await AttachSellerInfoAsync(items);

        return (items, total);
    }

    public async Task AddAsync(Listing listings)
    {
        _db.Listings.Add(listings);
        await _db.SaveChangesAsync();
    }

    public async Task SaveAsync()
    {
        await _db.SaveChangesAsync();
    }

    public async Task UpdateAsync(Listing listings, Guid id)
    {
        listings.ListingId = id;
        _db.Listings.Update(listings);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteByIdAsync(Guid id)
    {
        var listing = await _db.Listings.FindAsync(id);
        if (listing != null)
        {
            listing.ListingStatus = RemovedStatus;
            listing.UpdatedAt = DateTime.UtcNow;
            listing.RejectionReason = "Listing deleted by owner";
            await _db.SaveChangesAsync();
        }
    }

    // helper function to attach a seller (with their information) to a listing
    private async Task AttachSellerInfoAsync(IReadOnlyCollection<Listing> listings)
    {
        if (listings.Count == 0)
        {
            return;
        }

        var sellerIds = listings.Select(l => l.SellerId).Distinct().ToList();

        var sellers = await _db
            .Users.AsNoTracking()
            .Where(u => sellerIds.Contains(u.UserId))
            .Select(u => new
            {
                u.UserId,
                u.FirstName,
                u.LastName,
                University = u.StudentProfile != null
                    ? _db
                        .Universities.Where(uni =>
                            uni.UniversityId == u.StudentProfile.UniversityId
                        )
                        .Select(uni => uni.Name)
                        .FirstOrDefault()
                    : null,
            })
            .ToListAsync();
        var counts = await GetActiveListingCountsAsync(sellerIds);

        var byId = sellers.ToDictionary(
            u => u.UserId,
            u => new SellerInfo(
                u.UserId,
                u.FirstName,
                u.LastName,
                u.University,
                counts.GetValueOrDefault(u.UserId, 0)
            )
        );

        foreach (var listing in listings)
        {
            if (byId.TryGetValue(listing.SellerId, out var seller))
            {
                listing.Seller = seller;
            }
        }
    }

    public async Task<ListingCategory?> ResolveByNameAsync(
        string categoryName,
        CancellationToken ct = default
    )
    {
        if (string.IsNullOrWhiteSpace(categoryName))
        {
            return null;
        }

        var normalized = categoryName.Trim();
        return await _db
            .ListingCategories.AsNoTracking()
            .FirstOrDefaultAsync(c => c.IsActive && EF.Functions.ILike(c.Name, normalized), ct);
    }

    public async Task<bool> IsOwnerAsync(Guid listingId, Guid sellerId)
    {
        return await _db
            .Listings.AsNoTracking()
            .AnyAsync(l =>
                l.ListingId == listingId
                && l.SellerId == sellerId
                && l.ListingStatus != RemovedStatus
            );
    }

    public async Task<List<ListingCategory>> GetActiveCategories()
    {
        return await _db
            .ListingCategories.AsNoTracking()
            .Where(c => c.IsActive)
            .OrderBy(c => c.Name)
            .ToListAsync();
    }

    public async Task MarkAllBySellerAsRemovedAsync(Guid sellerId, string reason)
    {
        var listings = await _db
            .Listings.Where(l =>
                l.SellerId == sellerId
                && (l.ListingStatus == "live" || l.ListingStatus == "pending")
            )
            .ToListAsync();
        if (!listings.Any())
        {
            return;
        }
        foreach (var listing in listings)
        {
            listing.ListingStatus = RemovedStatus;
            listing.UpdatedAt = DateTime.UtcNow;
            listing.RejectionReason = reason;
        }

        await _db.SaveChangesAsync();
    }

    public async Task<bool> TryReserveAsync(Guid listingId, CancellationToken ct = default)
    {
        var rows = await _db
            .Listings.Where(l => l.ListingId == listingId && l.ListingStatus == "live")
            .ExecuteUpdateAsync(s => s.SetProperty(l => l.ListingStatus, "reserved"), ct);
        return rows == 1;
    }

    public async Task<bool> ReleaseAsync(Guid listingId, CancellationToken ct = default)
    {
        var rows = await _db
            .Listings.Where(l => l.ListingId == listingId && l.ListingStatus == "reserved")
            .ExecuteUpdateAsync(s => s.SetProperty(l => l.ListingStatus, "live"), ct);
        return rows == 1;
    }

    public async Task<Dictionary<Guid, int>> GetActiveListingCountsAsync(
        IEnumerable<Guid> sellerIds,
        CancellationToken ct = default
    )
    {
        var ids = sellerIds.ToList();
        if (ids.Count == 0)
        {
            return new Dictionary<Guid, int>();
        }
        return await _db
            .Listings.AsNoTracking()
            .Where(l =>
                ids.Contains(l.SellerId)
                && (l.ListingStatus == "live" || l.ListingStatus == "reserved")
            )
            .GroupBy(l => l.SellerId)
            .Select(g => new { SellerId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.SellerId, x => x.Count, ct);
    }
}
