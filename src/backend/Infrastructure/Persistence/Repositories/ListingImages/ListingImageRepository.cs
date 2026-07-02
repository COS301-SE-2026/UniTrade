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
}
