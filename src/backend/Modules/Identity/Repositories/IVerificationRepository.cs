using Modules.Identity.Models;
using Modules.Identity.Models.Dto;

namespace Modules.Identity.Verification;

public interface IVerificationRepository
{
    Task<VerificationRequest?> GetCurrentByUserIdAsync(Guid userId);
    Task CreateAsync(VerificationRequest request);

    Task UpdateAsync(VerificationRequest request);
    Task<IReadOnlyList<VerificationCaseDto>> ListPendingAsync(CancellationToken ct = default);
    Task<VerificationCaseDto?> GetCaseByIdAsync(
        Guid verificationId,
        CancellationToken ct = default
    );
    Task<VerificationRequest?> GetByIdAsync(Guid verificationId, CancellationToken ct = default);
}
