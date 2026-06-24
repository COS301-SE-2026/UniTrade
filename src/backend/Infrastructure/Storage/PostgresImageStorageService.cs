using System.Net.Mime;
using Microsoft.Extensions.Configuration;
using Modules.SharedKernel;

namespace Infrastructure.Storage;

public class PostgresImageStorageService : IImageStorageService
{
    private readonly IListingImageRepository _images;

    public BlobStorageService(IListingImageRepository images) => _images = images;

    Task<int> UploadAsync(
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

    Task<(byte[] Data, string ContentType)> GetAsync(int imageId, CancellationToken ct = default)
    {
        return _images.GetDataAsync(imageId, ct);
    }

    public async Task DeleteAsync(string blobUrl, CancellationToken ct = default)
    {
        return _images.DeleteAsync(imageId, ct);
    }
}