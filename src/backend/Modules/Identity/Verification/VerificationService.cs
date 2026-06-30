using System.Security.Cryptography;
using System.Text;
using Modules.Identity.Models;
using Modules.Identity.Repositories;
using Modules.Notifications;

namespace Modules.Identity.Verification;

using System.Security.Cryptography.X509Certificates;
using Microsoft.Extensions.Configuration;

public class VerificationService : IVerificationService
{
    private readonly IVerificationRepository _verifications;

    private readonly IUserRepository _users;
    private readonly INotificationsService _notifications;
    private readonly IConfiguration _config;
    private const int OTP_EXPIRY_MINUTES = 5;
    private const int MAX_ATTEMPTS = 3;
    private const int MAX_RESENDS = 3;
    private const int RESEND_COOLDOWN_SECONDS = 60;

    public VerificationService(
        IVerificationRepository verifications,
        IUserRepository users,
        INotificationsService notifications,
        IConfiguration config
    )
    {
        _verifications = verifications;
        _users = users;
        _notifications = notifications;
        _config = config;
    }

    public async Task InitiateAsync(string email, Guid userId)
    {
        var user = await _users.GetByIdAsync(userId);
        if (user == null)
        {
            throw new Exception("user_not_found");
        }

        // invalidate previous otp
        var existing = await _verifications.GetCurrentByUserIdAsync(userId);

        if (existing != null)
        {
            existing.IsCurrent = false;
            await _verifications.UpdateAsync(existing);
        }
        var otp = GenerateOtp();
        var hash = HashOtp(otp);

        var record = new VerificationRequest
        {
            UserId = userId,

            OtpCodeHash = hash,
            OtpSentAt = DateTime.UtcNow,
            OtpExpiresAt = DateTime.UtcNow.AddMinutes(OTP_EXPIRY_MINUTES),

            AttemptNumber = 0,
            OtpResendCount = 0,

            IsCurrent = true,
            Status = "otp_pending",

            SubmittedAt = DateTime.UtcNow, // considering removing this since otp sent at handles this
        };

        await _verifications.CreateAsync(record);

        await _notifications.SendOtpEmailAsync(email, otp);
    }

    public async Task<bool> VerifyAsync(Guid userId, string otp)
    {
        var record = await _verifications.GetCurrentByUserIdAsync(userId);

        if (record == null)
        {
            throw new Exception("invalid_otp");
        }

        if (record.OtpVerifiedAt != null)
        {
            throw new Exception("already_verified");
        }

        if (record.AttemptNumber >= MAX_ATTEMPTS)
        {
            throw new Exception("otp_invalidated_resend_required");
        }
        if (record.OtpExpiresAt < DateTime.UtcNow)
        {
            throw new Exception("otp_expired");
        }

        var hash = HashOtp(otp);
        var hashBytes = Convert.FromBase64String(hash);
        var storedBytes = Convert.FromBase64String(record.OtpCodeHash);

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
                    throw new Exception($"too_many_attempts:{waitSeconds}");
                }
            }
            //but a guess genuinely cleared the delay window is counted
            record.AttemptNumber++;
            record.TotalAttemptCount = (record.TotalAttemptCount ?? 0) + 1;
            record.LastAttemptAt = DateTime.UtcNow;
            await _verifications.UpdateAsync(record);

            if (record.AttemptNumber >= MAX_ATTEMPTS)
            {
                throw new Exception("otp_invalidated_resend_required");
            }

            throw new Exception("invalid_otp");
        }

        record.Status = "por_pending";
        record.OtpVerifiedAt = DateTime.UtcNow;
        await _verifications.UpdateAsync(record);

        var User = await _users.GetByIdAsync(userId);
        if (User?.StudentProfile != null)
        {
            User.StudentProfile.VerificationStatus = "verified";
            await _users.UpdateAsync(User);
            await _notifications.SendWelcomeEmailAsync(User.Email, User.FirstName);
        }
        return true;
    }

    public async Task ResendAsync(Guid userId, string email)
    {
        var record = await _verifications.GetCurrentByUserIdAsync(userId);

        if (record == null)
        {
            throw new Exception("invalid_request");
        }

        if (record.OtpVerifiedAt != null)
        {
            throw new Exception("already_verified");
        }
        if (
            record.OtpSentAt != null
            && (DateTime.UtcNow - record.OtpSentAt.Value).TotalSeconds < RESEND_COOLDOWN_SECONDS
        )
            throw new Exception("cooldown_active");

        var otp = GenerateOtp();
        var hash = HashOtp(otp);

        record.OtpCodeHash = hash;
        record.OtpSentAt = DateTime.UtcNow;
        record.OtpExpiresAt = DateTime.UtcNow.AddMinutes(OTP_EXPIRY_MINUTES);
        record.OtpResendCount = (record.OtpResendCount ?? 0) + 1;
        record.AttemptNumber = 0;

        await _verifications.UpdateAsync(record);
        await _notifications.SendOtpEmailAsync(email, otp);
    }

    private static string GenerateOtp()
    {
        var bytes = RandomNumberGenerator.GetInt32(100000, 999999).ToString();

        return bytes;
    }

    private string HashOtp(string otp)
    {
        var secret =
            _config["Otp:Secret"]
            ?? throw new InvalidOperationException(
                "Otp:Secret environment variable is not configured"
            );

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(otp));
        return Convert.ToBase64String(hash);
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
