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
    private readonly string _removedStatus = "removed";

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
            .Include(l => l.Course)
            .Where(l => l.ListingStatus != _removedStatus)
            .Where(l => _db.Users.Any(u => u.UserId == l.SellerId && !u.IsDeleted));

        var listing = await query.FirstOrDefaultAsync(l => l.ListingId == listingId);

        if (listing == null)
        {
            return null;
        }
        await AttachImagesAsync(new[] { listing });
        await AttachSellerInfoAsync(new[] { listing });

        return listing;
    }

    // for updates
    public async Task<Listing?> GetByIdTrackedAsync(Guid id) =>
        await _db
            .Listings.Include(l => l.Category)
            .Include(l => l.BookDetails)
            .Include(l => l.Images)
            .Where(l => l.ListingStatus != _removedStatus)
            .Where(l => _db.Users.Any(u => u.UserId == l.SellerId && !u.IsDeleted))
            .FirstOrDefaultAsync(l => l.ListingId == id);

    public async Task<(IReadOnlyList<Listing> listings, int Total)> ListAsync(
        ListFilterDto listingFilterDto
    )
    {
        IQueryable<Listing> query = _db
            .Listings.AsNoTracking()
            .Include(l => l.Category)
            .Include(l => l.BookDetails);

        query = query.Where(l => l.ListingStatus != _removedStatus);
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

        var take = Math.Clamp(listingFilterDto.Take, 1, 100);

        IOrderedQueryable<Listing> ordered =
            listingFilterDto.ListingStatus == "live"
                ? query
                    .OrderByDescending(l => l.VisibilityScore ?? 100)
                    .ThenByDescending(l => l.CreatedAt)
                : query.OrderByDescending(l => l.CreatedAt);
        // Map to entity
        var items = await ordered
            .ThenByDescending(l => l.ListingId)
            .Skip(listingFilterDto.Skip)
            .Take(take)
            .ToListAsync();

        await AttachImagesAsync(items);
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
            listing.ListingStatus = _removedStatus;
            listing.UpdatedAt = DateTime.UtcNow;
            listing.RejectionReason = "Listing deleted by owner";
            await _db.SaveChangesAsync();
        }
    }

    // helper function to attach a seller (with their information) to a listing
    public async Task AttachSellerInfoAsync(IReadOnlyCollection<Listing> listings)
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
                && l.ListingStatus != _removedStatus
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
        if (listings.Count == 0)
        {
            return;
        }
        foreach (var listing in listings)
        {
            listing.ListingStatus = _removedStatus;
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

    private async Task AttachImagesAsync(IReadOnlyCollection<Listing> listings)
    {
        if (listings.Count == 0)
        {
            return;
        }

        var listingIds = listings.Select(l => l.ListingId).ToList();

        var images = await _db
            .ListingImages.AsNoTracking()
            .Where(img => listingIds.Contains(img.ListingId))
            .Select(img => new
            {
                img.ImageId,
                img.ListingId,
                img.IsPrimary,
            })
            .ToListAsync();

        var byListing = images
            .GroupBy(img => img.ListingId)
            .ToDictionary(g => g.Key, g => g.ToList());

        foreach (var listing in listings)
        {
            listing.Images = byListing.TryGetValue(listing.ListingId, out var imgs)
                ? imgs.Select(i => new ListingImage
                {
                    ImageId = i.ImageId,
                    ListingId = i.ListingId,
                    IsPrimary = i.IsPrimary,
                    ImageData = Array.Empty<byte>(),
                    ContentType = string.Empty,
                })
                    .ToList()
                : new List<ListingImage>();
        }
    }

    public async Task<bool> AdminRemoveAsync(
        Guid listingId,
        string reason,
        CancellationToken ct = default
    )
    {
        var rowsFetched = await _db
            .Listings.Where(l => l.ListingId == listingId && l.ListingStatus != _removedStatus)
            .ExecuteUpdateAsync(
                s =>
                    s.SetProperty(l => l.ListingStatus, "removed")
                        .SetProperty(l => l.RejectionReason, reason)
                        .SetProperty(l => l.UpdatedAt, DateTime.UtcNow),
                ct
            );

        return rowsFetched == 1;
    }

    public async Task<IReadOnlyList<Listing>> GetByGroupIdAsync(
        Guid groupId,
        CancellationToken ct = default
    ) =>
        await _db
            .Listings.AsNoTracking()
            .Where(l => l.ListingGroupId == groupId && l.ListingStatus != _removedStatus)
            .ToListAsync(ct);

    public async Task DuplicateImagesToGroupAsync(
        Guid sourceListingId,
        CancellationToken ct = default
    )
    {
        var groupId = await _db
            .Listings.AsNoTracking()
            .Where(l => l.ListingId == sourceListingId)
            .Select(l => l.ListingGroupId)
            .FirstOrDefaultAsync(ct);

        if (groupId is null)
            return;

        var sourceImages = await _db
            .ListingImages.AsNoTracking()
            .Where(img => img.ListingId == sourceListingId)
            .ToListAsync(ct);

        var siblingIds = await _db
            .Listings.Where(l =>
                l.ListingGroupId == groupId
                && l.ListingId != sourceListingId
                && l.ListingStatus != _removedStatus
            )
            .Select(l => l.ListingId)
            .ToListAsync(ct);

        if (siblingIds.Count == 0)
            return;

        await using var txn = await _db.Database.BeginTransactionAsync(ct);
        await _db
            .ListingImages.Where(img => siblingIds.Contains(img.ListingId))
            .ExecuteDeleteAsync(ct);

        if (sourceImages.Count > 0)
        {
            foreach (var siblingId in siblingIds)
            {
                foreach (var img in sourceImages)
                {
                    _db.ListingImages.Add(
                        new ListingImage
                        {
                            ListingId = siblingId,
                            ImageData = img.ImageData,
                            ContentType = img.ContentType,
                            FileSize = img.FileSize,
                            IsPrimary = img.IsPrimary,
                            UploadedAt = DateTime.UtcNow,
                        }
                    );
                }
            }
            await _db.SaveChangesAsync(ct);
        }
        await txn.CommitAsync(ct);
    }

    public async Task AddRangeAsync(IReadOnlyList<Listing> listings)
    {
        _db.Listings.AddRange(listings);
        await _db.SaveChangesAsync();
    }

    public async Task<IReadOnlyList<decimal>> GetComparablePricesAsync(
        int categoryId,
        int? courseId,
        Guid excludeListingId,
        Guid excludeSellerId,
        CancellationToken ct = default
    )
    {
        IQueryable<Listing> query = _db
            .Listings.AsNoTracking()
            .Where(l => l.ListingId != excludeListingId)
            .Where(l => l.SellerId != excludeSellerId)
            .Where(l => l.ListingStatus == "live" || l.ListingStatus == "low_visibility");

        query = courseId.HasValue
            ? query.Where(l => l.CourseId == courseId)
            : query.Where(l => l.CategoryId == categoryId);

        return await query.Select(l => l.Price).ToListAsync(ct);
    }

    public async Task<Listing?> GetByIdAnyStatusAsync(Guid listingId)
    {
        return await _db
            .Listings.AsNoTracking()
            .Include(l => l.Category)
            .FirstOrDefaultAsync(l => l.ListingId == listingId);
    }

    public async Task<int> CountHighRiskListingsForSellerAsync(
        Guid sellerId,
        Guid excludeListingId,
        CancellationToken ct = default
    )
    {
        return await _db
            .Listings.AsNoTracking()
            .CountAsync(
                l =>
                    l.SellerId == sellerId
                    && l.ListingId != excludeListingId
                    && l.AiRiskLevel == "high",
                ct
            );
    }
}
