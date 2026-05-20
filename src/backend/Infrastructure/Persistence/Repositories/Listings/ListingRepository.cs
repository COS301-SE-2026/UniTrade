using Microsoft.EntityFrameworkCore;
using Infrastructure.Persistence;
using Modules.Listings.Models;
using Modules.Listings.Models.Dto;
using Modules.Listings.Repositories;
using System.Diagnostics.CodeAnalysis;
using System.ComponentModel.DataAnnotations;
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
        var listing = await _db.Listings
                .Where(l => l.ListingId == listingId)
                .Join(_db.Users,
                    l => l.SellerId,
                    u => u.UserId,
                    (l, u) => new { l, u })
                .Select(x => new Listing // join listing with users
                {
                    ListingId = x.l.ListingId,
                    SellerId = x.l.SellerId,
                    Title = x.l.Title,
                    Description = x.l.Description,
                    Price = x.l.Price,
                    Condition = x.l.Condition,
                    ListingType = x.l.ListingType,
                    ListingStatus = x.l.ListingStatus,
                    CourseId = x.l.CourseId,
                    Isbn = x.l.Isbn,
                    Author = x.l.Author,
                    Edition = x.l.Edition,
                    ViewCount = x.l.ViewCount,
                    CreatedAt = x.l.CreatedAt,
                    UpdatedAt = x.l.UpdatedAt,
                    Seller = new SellerInfo(x.u.UserId, x.u.FirstName, x.u.LastName)
                })
                .FirstOrDefaultAsync();
        if (listing == null)
        {
            return null;
        }
        listing.Images = await _db.ListingImages.Where(i => i.ListingId == listing.ListingId).ToListAsync();
        return listing;

    }

    public async Task<(IReadOnlyList<Listing> listings, int Total)> ListAsync(ListFilterDto listingFilterDto)
    {
        var query =  _db.Listings
                .Join(_db.Users,
                    l => l.SellerId,
                    u => u.UserId,
                    (l, u) => new { l, u }).AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(listingFilterDto.ListingType))
        {
            query = query.Where(x => x.l.ListingType == listingFilterDto.ListingType);

        }

        if (!string.IsNullOrWhiteSpace(listingFilterDto.ListingStatus))
        {
            query = query.Where(x => x.l.ListingStatus == listingFilterDto.ListingStatus);

        }
        if (listingFilterDto.CourseId.HasValue)
        {
            query = query.Where(x => x.l.CourseId == listingFilterDto.CourseId);

        }

        if (listingFilterDto.SellerId.HasValue)
        {
            query = query.Where(x => x.l.SellerId == listingFilterDto.SellerId);

        }

        if (!string.IsNullOrWhiteSpace(listingFilterDto.Search))
        {
            var searchInput = listingFilterDto.Search.Trim();
            query = query.Where(x => x.l.Title.Contains(searchInput) || x.l.Description.Contains(searchInput));

        }

        var listingCount = await query.CountAsync();

        var items = await query
                .OrderByDescending(x => x.l.CreatedAt)
                .Select(x => new Listing
                {
                    ListingId = x.l.ListingId,
                    SellerId = x.l.SellerId,
                    Title = x.l.Title,
                    Description = x.l.Description,
                    Price = x.l.Price,
                    Condition = x.l.Condition,
                    ListingType = x.l.ListingType,
                    ListingStatus = x.l.ListingStatus,
                    CourseId = x.l.CourseId,
                    ViewCount = x.l.ViewCount,
                    CreatedAt = x.l.CreatedAt,
                    UpdatedAt = x.l.UpdatedAt,
                    Seller = new SellerInfo(x.u.UserId, x.u.FirstName, x.u.LastName)
                })
                .ToListAsync();

        var listingIds = items.Select(l => l.ListingId).ToList();
        var images = await _db.ListingImages
            .Where(i => listingIds.Contains(i.ListingId))
            .ToListAsync();

        foreach (var item in items)
            item.Images = images.Where(i => i.ListingId == item.ListingId).ToList();

        return (items, listingCount);
    }
}