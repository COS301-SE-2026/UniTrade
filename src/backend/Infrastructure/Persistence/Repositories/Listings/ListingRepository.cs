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
            .Include(l => l.Images);

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

        if (listingFilterDto.CategoryId.HasValue)
            query = query.Where(x => x.CategoryId == listingFilterDto.CategoryId);

        if (!string.IsNullOrWhiteSpace(listingFilterDto.ListingStatus))
            query = query.Where(x => x.ListingStatus == listingFilterDto.ListingStatus);

        if (listingFilterDto.CourseId.HasValue)
            query = query.Where(x => x.CourseId == listingFilterDto.CourseId);

        if (listingFilterDto.SellerId.HasValue)
            query = query.Where(x => x.SellerId == listingFilterDto.SellerId);

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
            _db.Listings.Remove(listing);
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
            })
            .ToListAsync();

        var byId = sellers.ToDictionary(
            u => u.UserId,
            u => new SellerInfo(u.UserId, u.FirstName, u.LastName)
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
            .AnyAsync(l => l.ListingId == listingId && l.SellerId == sellerId);
    }

    public async Task<List<ListingCategory>> GetActiveCategories()
    {
        return await _db
            .ListingCategories.AsNoTracking()
            .Where(c => c.IsActive)
            .OrderBy(c => c.Name)
            .ToListAsync();
    }
}
