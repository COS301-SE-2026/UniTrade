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

    public string GetReadUrl(string blobNameOrUrl, TimeSpan? validFor = null)
    {
        var blobName = Uri.TryCreate(blobNameOrUrl, UriKind.Absolute, out var uri)
            ? Path.GetFileName(uri.LocalPath)
            : blobNameOrUrl;

        var blob = _container.GetBlobClient(blobName);

        if (!blob.CanGenerateSasUri)
            throw new InvalidOperationException("Cannot generate SAS — no account key available.");

        var sas = new BlobSasBuilder
        {
            BlobContainerName = _container.Name,
            BlobName = blobName,
            Resource = "b",
            ExpiresOn = DateTimeOffset.UtcNow.Add(validFor ?? TimeSpan.FromMinutes(30)),
        };
        sas.SetPermissions(BlobSasPermissions.Read);

        return blob.GenerateSasUri(sas).ToString();
    }

    public async Task DeleteAsync(string blobUrl, CancellationToken ct = default)
    {
        var blobName = Path.GetFileName(new Uri(blobUrl).LocalPath);
        await _container.DeleteBlobIfExistsAsync(blobName, cancellationToken: ct);
    }
}
