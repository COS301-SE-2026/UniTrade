using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Modules.Wishlist.Models;
using Modules.Wishlist.Repositories;

namespace Infrastructure.Persistence.Repositories;

public class WishlistRepository : IWishlistRepository
{
    private readonly AppDbContext _db;

    public WishlistRepository(AppDbContext db) => _db = db;

    public Task<WishlistItem?> GetAsync(
        Guid studentId,
        Guid listingId,
        CancellationToken ct = default
    ) =>
        _db.WishlistItems.FirstOrDefaultAsync(
            w => w.StudentId == studentId && w.ListingId == listingId,
            ct
        );

    public async Task<IReadOnlyList<WishlistItem>> ListForStudentAsync(
        Guid student,
        CancellationToken ct = default
    ) =>
        await _db
            .WishlistItems.AsNoTracking()
            .Where(w => w.StudentId == student)
            .Include(w => w.Listing)
                .ThenInclude(l => l!.Images)
            .Include(w => w.Listing)
                .ThenInclude(l => l!.Category)
            .Include(w => w.Listing)
                .ThenInclude(l => l!.BookDetails)
            .OrderByDescending(w => w.AddedAt)
            .ToListAsync(ct);

    public async Task AddAsync(WishlistItem item, CancellationToken ct = default)
    {
        await _db.WishlistItems.AddAsync(item, ct);
    }

    public Task SaveAsync(CancellationToken ct = default) => _db.SaveChangesAsync(ct);

    public async Task<bool> RemoveAsync(Guid studentId, Guid listingId, CancellationToken ct = default)
    {
        var rows = await _db.WishlistItems.Where(w => w.StudentId == studentId && w.ListingId == listingId).ExecuteDeleteAsync(ct);
        return rows > 0;
    }

    public async Task RemoveAllForListingAsync(Guid listingId, CancellationToken ct = default)
    {
        await _db.WishlistItems.Where(w => w.ListingId == listingId).ExecuteDeleteAsync(ct);
    }
}
