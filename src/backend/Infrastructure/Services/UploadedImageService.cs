using Modules.SharedKernel;
using Modules.SharedKernel.Repositories;

namespace Infrastructure.Services;

public class UploadedImageService : IUploadedImageService
{
    private readonly IUploadedImageRepository _uploadedImages;

    public UploadedImageService(IUploadedImageRepository uploadedImages) =>
        _uploadedImages = uploadedImages;

    public async Task<(int imageId, string Url)?> UploadAsync(
        byte[] data,
        string contentType,
        CancellationToken ct = default
    )
    {
        var image = await _uploadedImages.AddAsync(data, contentType, ct);
        return (image.ImageId, $"/api/images/{image.ImageId}");
    }

    public async Task<(byte[] Data, string contentType)?> GetAsync(
        int imageId,
        CancellationToken ct = default
    )
    {
        var image = await _uploadedImages.GetAsync(imageId, ct);
        return image is not null ? (image.ImageData, image.ContentType) : null;
    }

    public async Task DeleteAsync(int imageId, CancellationToken ct = default) =>
        await _uploadedImages.DeleteAsync(imageId, ct);
}
