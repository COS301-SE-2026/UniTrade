namespace Modules.SharedKernel;

public interface IImageStorageService
{
    Task<int> UploadAsync(
        Guid listingId,
        byte[] data,
        string contentType,
        bool IsPrimary,
        CancellationToken ct = default
    );
    Task<(byte[] Data, string ContentType)?> GetAsync(int imageId, CancellationToken ct = default);
    Task DeleteAsync(int imageId, CancellationToken ct = default);
}
