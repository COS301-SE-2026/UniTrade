using Microsoft.Extensions.Configuration;
using Modules.Listings.Models;
using Modules.Listings.Repositories;
using Modules.Listings.Scoring;
using Modules.SharedKernel;

namespace Infrastructure.Storage;

public class PostgresImageStorageService : IImageStorageService
{
    private readonly IListingImageRepository _images;
    private readonly IPerceptualHashService _hashing;
    private readonly IClipVisionClient _clip;

    public PostgresImageStorageService(
        IListingImageRepository images,
        IPerceptualHashService hashing,
        IClipVisionClient clip
    )
    {
        _images = images;
        _hashing = hashing;
        _clip = clip;
    }

    public async Task<int> UploadAsync(
        Guid listingId,
        byte[] data,
        string contentType,
        bool isPrimary,
        CancellationToken ct = default
    )
    {
        var image = new ListingImage
        {
            ListingId = listingId,
            ImageData = data,
            ContentType = contentType,
            FileSize = data.Length,
            IsPrimary = isPrimary,
            PerceptualHash = _hashing.ComputeHash(data),
            Embedding = await _clip.EmbedAsync(data, ct),
        };

        return await _images.AddAsync(image, ct);
    }

    public Task<(byte[] Data, string ContentType)?> GetAsync(
        int imageId,
        CancellationToken ct = default
    ) => _images.GetDataAsync(imageId, ct);

    public Task DeleteAsync(int imageId, CancellationToken ct = default) =>
        _images.DeleteAsync(imageId, ct);
}
