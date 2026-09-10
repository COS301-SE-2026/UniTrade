using Modules.SharedKernel;

namespace Modules.SharedKernel.Repositories;

public interface IUploadedImageRepository
{
    Task<Image> AddAsync(byte[] data, string contentType, CancellationToken ct = default);
    Task<Image?> GetAsync(int imageId, CancellationToken ct = default);
    Task DeleteAsync(int imageId, CancellationToken ct = default);

}
