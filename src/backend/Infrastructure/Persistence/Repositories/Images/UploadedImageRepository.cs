using Modules.SharedKernel;
using Modules.SharedKernel.Repositories;
using Microsoft.EntityFrameworkCore;
namespace Infrastructure.Persistence.Repositories.Images;

public class UploadedImageRepository : IUploadedImageRepository
{
    private readonly AppDbContext _db;

    public UploadedImageRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<Image> AddAsync(
        byte[] data,
        string contentType,
        CancellationToken ct = default
    )
    {
        var image = new Image
        {
            ImageData = data,
            ContentType = contentType,
            FileSize = data.Length,
            UploadedAt = DateTime.UtcNow,
        };
        await _db.Images.AddAsync(image, ct);
        await _db.SaveChangesAsync(ct);
        return image;
    }

    public async Task<Image?> GetAsync(int imageId, CancellationToken ct = default) =>
        await _db.Images.FirstOrDefaultAsync(i => i.ImageId == imageId, ct);

    public async Task DeleteAsync(int imageId, CancellationToken ct = default)
    {
        var image = await _db.Images.FirstOrDefaultAsync(i => i.ImageId == imageId, ct);

        if (image is not null)
        {
            _db.Images.Remove(image);
            await _db.SaveChangesAsync(ct);
        }
    }
}
