using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Configuration;
using Modules.SharedKernel;

namespace Infrastructure.Storage;

public class BlobStorageService : IBlobStorageService
{
    private readonly BlobContainerClient _container;

    public BlobStorageService(IConfiguration config)
    {
        var connectionString = config["Azure:Blob:ConnectionString"]
            ?? throw new InvalidOperationException("Blob connection string not configured");
        var containerName = config["Azure:Blob:Container"] ?? "listing-images";

        _container = new BlobContainerClient(connectionString, containerName);
        // Blob-level public read so the returned URLs work directly in <img src>
        _container.CreateIfNotExists();
    }

    public async Task<string> UploadAsync(Stream content, string fileName,
        string contentType, CancellationToken ct = default)
    {
        // Random name prevents collisions and stops users guessing/overwriting each other's files
        var blobName = $"{Guid.NewGuid()}{Path.GetExtension(fileName)}";
        var blob = _container.GetBlobClient(blobName);

        await blob.UploadAsync(content, new BlobUploadOptions
        {
            HttpHeaders = new BlobHttpHeaders { ContentType = contentType }
        }, ct);

        return blob.Uri.ToString();
    }

    public async Task DeleteAsync(string blobUrl, CancellationToken ct = default)
    {
        var blobName = Path.GetFileName(new Uri(blobUrl).LocalPath);
        await _container.DeleteBlobIfExistsAsync(blobName, cancellationToken: ct);
    }
}