using Modules.Listings.Repositories;
using Microsoft.Extensions.Configuration;
using Modules.Listings.Models;
using Modules.SharedKernel;

namespace Infrastructure.Storage;

public class PostgresImageStorageService : IImageStorageService
{
    private readonly IListingImageRepository _images;

    public PostgresImageStorageService(IListingImageRepository images) => _images = images;

    public Task<int> UploadAsync(
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
        };

        return _images.AddAsync(image, ct);
    }

    public Task<(byte[] Data, string ContentType)?> GetAsync(int imageId, CancellationToken ct = default) =>
        _images.GetDataAsync(imageId, ct);

    public Task DeleteAsync(int imageId, CancellationToken ct = default) =>
        _images.DeleteAsync(imageId, ct);
}
