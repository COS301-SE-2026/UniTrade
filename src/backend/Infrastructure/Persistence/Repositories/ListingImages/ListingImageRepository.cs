using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Modules.Listings.Models;
using Modules.Listings.Repositories;

namespace Infrastructure.Persistence.Repositories.ListingImages;

public class ListingImageRepository : IListingImageRepository
{
    private readonly AppDbContext _db;

    public ListingImageRepository(AppDbContext db) => _db = db;

    public async Task<int> AddAsync(ListingImage image, CancellationToken ct = default)
    {
        _db.ListingImages.Add(image);
        await _db.SaveChangesAsync(ct);
        return image.ImageId;
    }

    public async Task<(byte[] Data, string ContentType)?> GetDataAsync(
        int imageId,
        CancellationToken ct = default
    )
    {
        var image = await _db
            .ListingImages.Where(i => i.ImageId == imageId)
            .Select(i => new { i.ImageData, i.ContentType })
            .FirstOrDefaultAsync(ct);

        return image is null ? null : (image.ImageData, image.ContentType);
    }

    public async Task DeleteAsync(int imageId, CancellationToken ct = default)
    {
        await _db.ListingImages.Where(i => i.ImageId == imageId).ExecuteDeleteAsync(ct);
    }

    public async Task<IReadOnlyList<(Guid SellerId,string Hash)>> GetComparableImageHashesAsync(Guid excludeListingId, CancellationToken ct=default)
    {
        var rows=await _db
            .ListingImages.AsNoTracking()
            .Where(img=>img.PerceptualHash!=null)
            .Where(img=>img.ListingId!=excludeListingId && (img.Listing!.ListingStatus=="live" || img.Listing!.ListingStatus=="low_visibility"))
            .Select(img=>new {img.Listing!.SellerId,Hash=img.PerceptualHash!})
            .ToListAsync(ct);

        return rows.Select(r=>(r.SellerId,r.Hash)).ToList();
    }

}
