using Modules.Identity.Models;

namespace Modules.Identity.Repositories;

public interface IProofOfRegistrationRepository
{
    Task<int> AddOrReplaceAsync(
        ProofOfRegistrationDocument document,
        CancellationToken ct = default
    );

    Task<(byte[] Data, string ContentType, string FileName)?> GetDataAsync(
        Guid verificationId,
        CancellationToken ct = default
    );

    Task DeleteAsync(Guid verificationId, CancellationToken ct = default);
}
