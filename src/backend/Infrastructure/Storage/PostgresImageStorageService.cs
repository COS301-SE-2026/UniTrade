
using Microsoft.Extensions.Configuration;
using Modules.SharedKernel;

namespace Infrastructure.Storage;

public class PostgresImageStorageService : IImageStorageService
{

    public BlobStorageService(IConfiguration config)
    {
        var connectionString = config["Azure:Blob:ConnectionString"]
            ?? throw new InvalidOperationException("Blob connection string not configured");
        var containerName = config["Azure:Blob:Container"] ?? "listing-images";

        _container = new BlobContainerClient(connectionString, containerName);
        _container.CreateIfNotExists();
    }

    public async Task<string> UploadAsync(Stream content, string fileName,
        string contentType, CancellationToken ct = default)
    {
        var blobName = $"{Guid.NewGuid()}{Path.GetExtension(fileName)}";
        var blob = _container.GetBlobClient(blobName);

        await blob.UploadAsync(content, new BlobUploadOptions
        {
            HttpHeaders = new BlobHttpHeaders { ContentType = contentType }
        }, ct);

        return blob.Uri.ToString();


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
            ExpiresOn = DateTimeOffset.UtcNow.Add(validFor ?? TimeSpan.FromMinutes(30))
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