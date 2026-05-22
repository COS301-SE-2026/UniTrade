namespace Modules.SharedKernel;

public interface IBlobStorageService
{
    Task<string> UploadAsync(Stream content, string fileName, string contentType, CancellationToken ct = default);
    string GetReadUrl(string blobNameOrUrl, TimeSpan? validFor = null);
    Task DeleteAsync(string blobUrl, CancellationToken ct = default);
}