using Modules.Identity.Models.Dto;

namespace Modules.Identity.Verification;

public interface IVerificationService
{
    Task InitiateAsync(string email, Guid userId);
    Task<bool> VerifyAsync(Guid userId, string otp);
    Task ResendAsync(Guid userId, string email);
    Task<IReadOnlyList<VerificationCaseDto>> ListPendingAsync(CancellationToken ct = default);
    Task<VerificationCaseDto?> GetCaseAsync(Guid verificationId, CancellationToken ct = default);

    Task<VerificationCaseDto?> DecideAsync(
        Guid verificationId,
        Guid adminId,
        VerificationDecision decision,
        string? reason,
        CancellationToken ct = default
    );

    Task SubmitProofOfRegistrationAsync(
        Guid userId,
        byte[] fileData,
        string contentType,
        string fileName,
        CancellationToken ct = default
    );
}
