using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Modules.Identity.Models;
using Modules.Identity.Models.Dto;
using Modules.Identity.Repositories;
using Modules.Notifications;
using Modules.SharedKernel;

namespace Modules.Identity.Verification;

public sealed class VerificationException(string code) : Exception(code) { }

public class VerificationService : IVerificationService
{
    private readonly IVerificationRepository _verifications;

    private readonly IUserRepository _users;
    private readonly IEmailService _emails;
    private readonly IProofOfRegistrationStorageService _porStorage;
    private readonly IIdentityService _identity;
    private readonly IConfiguration _config;
    private const int _otpExpiryMinutes = 5;
    private const int _maxAttempts = 3;
    private const int _resendCooldownSeconds = 60;

    public VerificationService(
        IVerificationRepository verifications,
        IUserRepository users,
        IEmailService emails,
        IProofOfRegistrationStorageService porStorage,
        IIdentityService identity,
        IConfiguration config
    )
    {
        _verifications = verifications;
        _users = users;
        _emails = emails;
        _porStorage = porStorage;
        _identity = identity;
        _config = config;
    }

    public async Task InitiateAsync(string email, Guid userId)
    {
        var user = await _users.GetByIdAsync(userId);
        if (user == null)
        {
            throw new VerificationException("user_not_found");
        }

        // invalidate previous otp
        var existing = await _verifications.GetCurrentByUserIdAsync(userId);

        if (existing != null)
        {
            existing.IsCurrent = false;
            await _verifications.UpdateAsync(existing);
        }
        var otp = GenerateOtp();
        var secret =
            _config["Otp:Secret"]
            ?? throw new InvalidOperationException(
                "Otp:Secret environment variable is not configured"
            );
        var hash = OtpSecurity.HashOtp(otp, secret);

        var record = new VerificationRequest
        {
            UserId = userId,

            OtpCodeHash = hash,
            OtpSentAt = DateTime.UtcNow,
            OtpExpiresAt = DateTime.UtcNow.AddMinutes(_otpExpiryMinutes),

            AttemptNumber = 0,
            OtpResendCount = 0,

            IsCurrent = true,
            Status = "otp_pending",

            SubmittedAt = DateTime.UtcNow, // considering removing this since otp sent at handles this
        };

        await _verifications.CreateAsync(record);

        await _emails.SendOtpEmailAsync(email, otp);
    }

    public async Task<bool> VerifyAsync(Guid userId, string otp)
    {
        var record = await _verifications.GetCurrentByUserIdAsync(userId);

        if (record == null)
        {
            throw new VerificationException("invalid_otp");
        }

        if (record.OtpVerifiedAt != null)
        {
            throw new VerificationException("already_verified");
        }

        if (record.AttemptNumber >= _maxAttempts)
        {
            throw new VerificationException("otp_invalidated_resend_required");
        }
        if (record.OtpExpiresAt < DateTime.UtcNow)
        {
            throw new VerificationException("otp_expired");
        }

        var secret =
            _config["Otp:Secret"]
            ?? throw new InvalidOperationException(
                "Otp:Secret environment variable is not configured"
            );
        var hash = OtpSecurity.HashOtp(otp, secret);
        var hashBytes = Convert.FromBase64String(hash);
        var storedBytes = Convert.FromBase64String(record.OtpCodeHash!);

        if (!CryptographicOperations.FixedTimeEquals(hashBytes, storedBytes))
        {
            // instead of locking the account, exponential delay is applied
            var requiredDelay = ComputeDelay(record.TotalAttemptCount ?? 0);

            if (record.LastAttemptAt != null)
            {
                var elapsed = DateTime.UtcNow - record.LastAttemptAt.Value;
                if (elapsed < requiredDelay)
                {
                    // if a user tries too soon since the last failure occurred, we reject it without counting it
                    // as a new attempt
                    var waitSeconds = (int)(requiredDelay - elapsed).TotalSeconds;
                    throw new VerificationException($"too_many_attempts:{waitSeconds}");
                }
            }
            //but a guess genuinely cleared the delay window is counted
            record.AttemptNumber++;
            record.TotalAttemptCount = (record.TotalAttemptCount ?? 0) + 1;
            record.LastAttemptAt = DateTime.UtcNow;
            await _verifications.UpdateAsync(record);

            if (record.AttemptNumber >= _maxAttempts)
            {
                throw new VerificationException("otp_invalidated_resend_required");
            }

            throw new VerificationException("invalid_otp");
        }

        record.Status = "por_pending";
        record.OtpVerifiedAt = DateTime.UtcNow;
        await _verifications.UpdateAsync(record);

        var User = await _users.GetByIdAsync(userId);
        if (User?.StudentProfile != null)
        {
            User.StudentProfile.VerificationStatus = "partial";
            await _users.UpdateAsync(User);
            await _emails.SendWelcomeEmailAsync(User.Email, User.FirstName);
        }
        return true;
    }

    public async Task ResendAsync(Guid userId, string email)
    {
        var record = await _verifications.GetCurrentByUserIdAsync(userId);

        if (record == null)
        {
            throw new VerificationException("invalid_request");
        }

        if (record.OtpVerifiedAt != null)
        {
            throw new VerificationException("already_verified");
        }
        if (
            record.OtpSentAt != null
            && (DateTime.UtcNow - record.OtpSentAt.Value).TotalSeconds < _resendCooldownSeconds
        )
            throw new VerificationException("cooldown_active");

        var otp = GenerateOtp();
        var secret =
            _config["Otp:Secret"]
            ?? throw new InvalidOperationException(
                "Otp:Secret environment variable is not configured"
            );
        var hash = OtpSecurity.HashOtp(otp, secret);

        record.OtpCodeHash = hash;
        record.OtpSentAt = DateTime.UtcNow;
        record.OtpExpiresAt = DateTime.UtcNow.AddMinutes(_otpExpiryMinutes);
        record.OtpResendCount = (record.OtpResendCount ?? 0) + 1;
        record.AttemptNumber = 0;

        await _verifications.UpdateAsync(record);
        await _emails.SendOtpEmailAsync(email, otp);
    }

    public Task<IReadOnlyList<VerificationCaseDto>> ListPendingAsync(
        CancellationToken ct = default
    ) => _verifications.ListPendingAsync(ct);

    public Task<VerificationCaseDto?> GetCaseAsync(
        Guid verificationId,
        CancellationToken ct = default
    ) => _verifications.GetCaseByIdAsync(verificationId, ct);

    public async Task<VerificationCaseDto?> DecideAsync(
        Guid verificationId,
        Guid adminId,
        VerificationDecision decision,
        string? reason,
        CancellationToken ct = default
    )
    {
        var vr = await _verifications.GetByIdAsync(verificationId, ct);
        if (vr is null || !vr.IsCurrent)
        {
            return null;
        }

        if (vr.AdminDecision is "approved" or "rejected")
        {
            throw new VerificationException("verification_already_decided");
        }

        var user = await _users.GetByIdAsync(vr.UserId);
        if (user?.StudentProfile is null)
        {
            throw new VerificationException("user_not_found");
        }

        vr.AdminId = adminId;
        vr.DecidedAt = DateTime.UtcNow;

        switch (decision)
        {
            case VerificationDecision.Approve:
                vr.Status = "approved";
                vr.AdminDecision = "approved";
                user.StudentProfile.VerificationStatus = "verified";
                break;

            case VerificationDecision.Reject:
                vr.Status = "rejected";
                vr.AdminDecision = "rejected";
                vr.RejectionReason = reason;
                user.StudentProfile.VerificationStatus = "rejected";
                break;

            case VerificationDecision.Resubmit:
                vr.AdminDecision = "resubmission";
                vr.RejectionReason = reason;
                user.StudentProfile.VerificationStatus = "pending";
                break;
        }

        await _verifications.UpdateAsync(vr);
        await _users.UpdateAsync(user);

        await _emails.SendVerificationDecisionEmailAsync(
            user.Email,
            user.FirstName,
            vr.AdminDecision!,
            reason
        );

        /*if (decision == VerificationDecision.Approve)
        {
            await _emails.SendWelcomeEmailAsync(user.Email, user.FirstName);
        }*/

        var result = await _verifications.GetCaseByIdAsync(verificationId, ct);

        if (decision == VerificationDecision.Reject)
        {
            await _identity.DeleteAccountAsync(vr.UserId.ToString());
        }
        return result;
    }

    public async Task SubmitProofOfRegistrationAsync(
        Guid userId,
        byte[] fileData,
        string contentType,
        string fileName,
        CancellationToken ct = default
    )
    {
        var record = await _verifications.GetCurrentByUserIdAsync(userId);

        if (record == null)
        {
            throw new VerificationException("no_pending_verification");
        }

        if (record.Status is not ("por_pending" or "under_review"))
        {
            throw new VerificationException("invalid_verification_state");
        }

        await _porStorage.UploadAsync(record.VerificationId, fileData, contentType, fileName, ct);

        record.Status = "under_review";
        record.AdminDecision = null;
        await _verifications.UpdateAsync(record);
    }

    private static string GenerateOtp()
    {
        var bytes = RandomNumberGenerator.GetInt32(100000, 999999).ToString();

        return bytes;
    }

    private static TimeSpan ComputeDelay(int count)
    {
        // the delay grows exponentially till the 15 minute bound
        if (count == 0)
            return TimeSpan.Zero;
        var seconds = Math.Min(Math.Pow(2, count), 900);
        return TimeSpan.FromSeconds(seconds);
    }
}
