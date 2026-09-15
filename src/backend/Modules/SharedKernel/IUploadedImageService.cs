namespace Modules.SharedKernel;

public interface IUploadedImageService
{
    Task<(int imageId, string Url)?> UploadAsync(
        byte[] data,
        string contentType,
        CancellationToken ct = default
    );
    Task<(byte[] Data, string contentType)?> GetAsync(
        int imageId,
        CancellationToken ct = default
    );
    Task DeleteAsync(int imageId, CancellationToken ct = default);
}
