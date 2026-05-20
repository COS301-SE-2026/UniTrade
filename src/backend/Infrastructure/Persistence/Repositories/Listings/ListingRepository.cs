using Microsoft.EntityFrameworkCore;
using Infrastructure.Persistence;
using Modules.Listings.Models;
using Modules.Listings.Models.DTO;
using Modules.Listings.Repositories;
using Modules.Listings.Models.Dto;
namespace Infrastructure.Persistence.Repositories.Listings;

public class ListingRepository : IListingRepository
{
    private readonly AppDbContext _db;

    public ListingRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<Listing?> GetByIdAsync(Guid listingId)
    {
        var row = await _db.Listings
            .AsNoTracking()
            .Where(l => l.ListingId == listingId)
            .Join(_db.Users,
                l => l.SellerId,
                u => u.UserId,
                (l, u) => new
                {
                    l.ListingId,
                    l.SellerId,
                    l.Title,
                    l.Description,
                    l.Price,
                    l.Condition,
                    l.ListingType,
                    l.ListingStatus,
                    l.CourseId,
                    l.Isbn,
                    l.Author,
                    l.Edition,
                    l.isBundle,
                    l.ViewCount,
                    l.CreatedAt,
                    l.UpdatedAt,
                    SellerUserId = u.UserId,
                    u.FirstName,
                    u.LastName
                })
            .FirstOrDefaultAsync();

        if (row == null)
            return null;

        var listing = new Listing
        {
            ListingId = row.ListingId,
            SellerId = row.SellerId,
            Title = row.Title,
            Description = row.Description,
            Price = row.Price,
            Condition = row.Condition,
            ListingType = row.ListingType,
            ListingStatus = row.ListingStatus,
            CourseId = row.CourseId,
            Isbn = row.Isbn,
            Author = row.Author,
            Edition = row.Edition,
            isBundle = row.isBundle,
            ViewCount = row.ViewCount,
            CreatedAt = row.CreatedAt,
            UpdatedAt = row.UpdatedAt,
            Seller = new SellerInfo(row.SellerUserId, row.FirstName, row.LastName)
        };

        listing.Images = await _db.ListingImages
            .AsNoTracking()
            .Where(i => i.ListingId == listing.ListingId)
            .ToListAsync();

        return listing;
    }

    public async Task<(IReadOnlyList<Listing> listings, int Total)> ListAsync(ListFilterDto listingFilterDto)
    {
        var query = _db.Listings
            .AsNoTracking()
            .Join(_db.Users,
                l => l.SellerId,
                u => u.UserId,
                (l, u) => new { l, u });

        if (!string.IsNullOrWhiteSpace(listingFilterDto.ListingType))
            query = query.Where(x => x.l.ListingType == listingFilterDto.ListingType);

        if (!string.IsNullOrWhiteSpace(listingFilterDto.ListingStatus))
            query = query.Where(x => x.l.ListingStatus == listingFilterDto.ListingStatus);

        if (listingFilterDto.CourseId.HasValue)
            query = query.Where(x => x.l.CourseId == listingFilterDto.CourseId);

        if (listingFilterDto.SellerId.HasValue)
            query = query.Where(x => x.l.SellerId == listingFilterDto.SellerId);

        if (!string.IsNullOrWhiteSpace(listingFilterDto.Search))
        {
            var searchInput = listingFilterDto.Search.Trim();
            query = query.Where(x =>
                x.l.Title.Contains(searchInput) || x.l.Description.Contains(searchInput));
        }

        var total = await query.CountAsync();


        var rows = await query
            .OrderByDescending(x => x.l.CreatedAt)
            .Select(x => new
            {
                x.l.ListingId,
                x.l.SellerId,
                x.l.Title,
                x.l.Description,
                x.l.Price,
                x.l.Condition,
                x.l.ListingType,
                x.l.ListingStatus,
                x.l.CourseId,
                x.l.Isbn,
                x.l.Author,
                x.l.Edition,
                x.l.isBundle,
                x.l.ViewCount,
                x.l.CreatedAt,
                x.l.UpdatedAt,
                SellerUserId = x.u.UserId,
                x.u.FirstName,
                x.u.LastName
            })
            .ToListAsync();

        // Map to entity
        var items = rows.Select(r => new Listing
        {
            ListingId = r.ListingId,
            SellerId = r.SellerId,
            Title = r.Title,
            Description = r.Description,
            Price = r.Price,
            Condition = r.Condition,
            ListingType = r.ListingType,
            ListingStatus = r.ListingStatus,
            CourseId = r.CourseId,
            Isbn = r.Isbn,
            Author = r.Author,
            Edition = r.Edition,
            isBundle = r.isBundle,
            ViewCount = r.ViewCount,
            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt,
            Seller = new SellerInfo(r.SellerUserId, r.FirstName, r.LastName)
        }).ToList();

        var listingIds = items.Select(l => l.ListingId).ToList();
        var images = await _db.ListingImages
            .AsNoTracking()
            .Where(i => listingIds.Contains(i.ListingId))
            .ToListAsync();

        foreach (var item in items)
            item.Images = images.Where(i => i.ListingId == item.ListingId).ToList();

        return (items, total);
    }

    public async Task AddAsync(Listing listings)
    {
        _db.Listings.Add(listings);
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


}