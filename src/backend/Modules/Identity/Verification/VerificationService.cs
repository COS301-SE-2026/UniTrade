
using System.Security.Cryptography;
using System.Text;
using Modules.Identity.Models;
using Modules.Notifications;

namespace Modules.Identity.Verification;

public class VerificationService : IVerificationService
{
    private readonly IVerificationRepository _verifications;
    private readonly INotificationsService _notifications;

    private const int OTP_EXPIRY_MINUTES = 5;
    private const int MAX_ATTEMPTS = 5;
    private const int MAX_RESENDS = 3;
    private const int RESEND_COOLDOWN_SECONDS = 60;

    public VerificationService(IVerificationRepository verifications, INotificationsService notifications)
    {
        _notifications = notifications;
        _verifications = verifications;
    }
    public async Task InitiateAsync(string email, Guid userId)
    {


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

            AttemptNumber = 1,
            OtpResendCount = 0,

            IsCurrent = true,
            Status = "otp_pending",

            SubmittedAt = DateTime.UtcNow
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

        if (record.Status == "otp_verified")
        {
            return true;
        }

        if (record.OtpExpiresAt < DateTime.UtcNow)
        {
            throw new Exception("otp_expired");
        }
        if (record.AttemptNumber >= MAX_ATTEMPTS)
        {
            record.Status = "rejected";
            await _verifications.UpdateAsync(record);
            throw new Exception("max_attempts_exceeded");

        }

        var hash = HashOtp(otp);

        if (hash != record.OtpCodeHash)
        {
            record.AttemptNumber++;
            await _verifications.UpdateAsync(record);
            throw new Exception("invalid_otp");
        }

        record.Status = "por_pending";
        record.OtpVerifiedAt = DateTime.UtcNow;

        await _verifications.UpdateAsync(record);
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

        if ((record.OtpResendCount ?? 0) >= MAX_RESENDS)
        {
            throw new Exception("resend_limit_exceeded");
        }


        if (record.OtpSentAt != null &&
        (DateTime.UtcNow - record.OtpSentAt.Value).TotalSeconds < RESEND_COOLDOWN_SECONDS)
            throw new Exception("cooldown_active");


        var otp = GenerateOtp();
        var hash = HashOtp(otp);


        record.UserId = userId;

        record.OtpCodeHash = hash;
        record.OtpSentAt = DateTime.UtcNow;
        record.OtpExpiresAt = DateTime.UtcNow.AddMinutes(OTP_EXPIRY_MINUTES);
        record.OtpResendCount = (record.OtpResendCount ?? 0) + 1;

        await _verifications.UpdateAsync(record);

        await _notifications.SendOtpEmailAsync(email, otp);

    }


    private string GenerateOtp()
    {
        var bytes = RandomNumberGenerator.GetBytes(2);
        var value = BitConverter.ToUInt16(bytes, 0) % 10000;
        return value.ToString("D4");
    }
    private string HashOtp(string otp)
    {
        var secret = Environment.GetEnvironmentVariable("Otp_Secret") ?? " ";

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(otp));
        return Convert.ToBase64String(hash);
    }
}