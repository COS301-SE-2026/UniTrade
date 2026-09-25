namespace Modules.SharedKernel;

public interface IProofOfRegistrationStorageService
{
    Task<int> UploadAsync(
        Guid verificationId,
        byte[] data,
        string contentType,
        string fileName,
        CancellationToken ct = default
    );

    Task<(byte[] Data, string ContentType, string FileName)?> GetAsync(
        Guid verificationId,
        CancellationToken ct = default
    );

    Task DeleteAsync(Guid verificationId, CancellationToken ct = default);
}
