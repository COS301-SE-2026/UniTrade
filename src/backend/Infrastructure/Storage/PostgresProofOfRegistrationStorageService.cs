using Modules.Identity.Models;
using Modules.Identity.Repositories;
using Modules.SharedKernel;

namespace Infrastructure.Storage;

public class PostgresProofOfRegistrationStorageService : IProofOfRegistrationStorageService
{
    private readonly IProofOfRegistrationRepository _documents;

    public PostgresProofOfRegistrationStorageService(IProofOfRegistrationRepository documents) =>
       _documents = documents;

    public Task<int> UploadAsync(
        Guid verificationId,
        byte[] data,
        string contentType,
        string fileName,
        CancellationToken ct = default
    )

    {
        var document = new ProofOfRegistrationDocument
        {
            VerificationId = verificationId,
            FileData = data,
            ContentType = contentType,
            FileSize = data.Length,
            FileName = fileName,
            UploadedAt = DateTime.UtcNow,
        };

        return _documents.AddOrReplaceAsync(document, ct);
    }

    public Task<(byte[] Data, string ContentType, string FileName)?> GetAsync(
        Guid verificationId,
        CancellationToken ct = default
    ) => _documents.GetDataAsync(verificationId, ct);

    public Task DeleteAsync(Guid verificationId, CancellationToken ct = default) =>
           _documents.DeleteAsync(verificationId, ct);
}
