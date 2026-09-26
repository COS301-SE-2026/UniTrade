namespace Modules.Identity.PasswordReset;

public interface IPasswordResetService
{
    Task InitiateAsync(string email);
    Task VerifyOtpAsync(string email, string otp);
    Task ResetPasswordAsync(string email, string otp, string newPassword);
}
csharp
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Modules.Identity.Models;
using Modules.Identity.Repositories;
using Modules.Notifications;

namespace Modules.Identity.PasswordReset;

public sealed class PasswordResetException(string code) : Exception(code) { }

public class PasswordResetService : IPasswordResetService
{
    private readonly IPasswordResetRepository _resets;
    private readonly IUserRepository _users;
    private readonly IEmailService _emails;
    private readonly IConfiguration _config;

    private const int _otpExpiryMinutes = 5;
    private const int _maxAttempts = 3;

    public PasswordResetService(
        IPasswordResetRepository resets,
        IUserRepository users,
        IEmailService emails,
        IConfiguration config)
    {
        _resets = resets;
        _users = users;
        _emails = emails;
        _config = config;
    }

    public async Task InitiateAsync(string email)
    {
        var user = await _users.GetByEmailAsync(email.Trim().ToLowerInvariant());

        if (user == null || user.IsDeleted)
            return;

        var existing = await _resets.GetCurrentByUserIdAsync(user.UserId);
        if (existing != null)
        {
            existing.IsCurrent = false;
            await _resets.UpdateAsync(existing);
        }

        var otp = GenerateOtp();
        var record = new PasswordResetRequest
        {
            UserId = user.UserId,
            OtpCodeHash = HashOtp(otp),
            OtpSentAt = DateTime.UtcNow,
            OtpExpiresAt = DateTime.UtcNow.AddMinutes(_otpExpiryMinutes),
            IsCurrent = true,
        };

        await _resets.CreateAsync(record);
        await _emails.SendPasswordResetOtpEmailAsync(user.Email, otp);
    }


    public async Task VerifyOtpAsync(string email, string otp)
    {
        var record = await GetValidRecordAsync(email);

        if (record.AttemptNumber >= _maxAttempts)
            throw new PasswordResetException("otp_invalidated_resend_required");

        if (record.OtpExpiresAt < DateTime.UtcNow)
            throw new PasswordResetException("otp_expired");

        if (!OtpMatches(otp, record.OtpCodeHash))
        {
            record.AttemptNumber++;
            await _resets.UpdateAsync(record);
            throw new PasswordResetException("invalid_otp");
        }

        record.OtpVerifiedAt = DateTime.UtcNow;
        await _resets.UpdateAsync(record);
    }

    public async Task ResetPasswordAsync(string email, string otp, string newPassword)
    {
        if (!IsPasswordStrong(newPassword))
            throw new PasswordResetException("weak_password");

        var record = await GetValidRecordAsync(email);

        if (record.OtpVerifiedAt == null)
            throw new PasswordResetException("otp_not_verified");

        if (record.OtpExpiresAt < DateTime.UtcNow)
            throw new PasswordResetException("otp_expired");

        if (!OtpMatches(otp, record.OtpCodeHash))
            throw new PasswordResetException("invalid_otp");

        var user = await _users.GetByEmailAsync(email.Trim().ToLowerInvariant());
        if (user == null)
            throw new PasswordResetException("user_not_found");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await _users.UpdateAsync(user);

        record.IsCurrent = false;
        await _resets.UpdateAsync(record);
    }

    private async Task<PasswordResetRequest> GetValidRecordAsync(string email)
    {
        var user = await _users.GetByEmailAsync(email.Trim().ToLowerInvariant());
        if (user == null)
            throw new PasswordResetException("invalid_otp"); // don't leak whether the account exists

        var record = await _resets.GetCurrentByUserIdAsync(user.UserId);
        if (record == null)
            throw new PasswordResetException("invalid_otp");

        return record;
    }

    private bool OtpMatches(string otp, string storedHash)
    {
        var hashBytes = Convert.FromBase64String(HashOtp(otp));
        var storedBytes = Convert.FromBase64String(storedHash);
        return CryptographicOperations.FixedTimeEquals(hashBytes, storedBytes);
    }

    private static string GenerateOtp() =>
        RandomNumberGenerator.GetInt32(100000, 999999).ToString();

    private string HashOtp(string otp)
    {
        var secret =
            _config["Otp:Secret"]
            ?? throw new InvalidOperationException("Otp:Secret environment variable is not configured");

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(otp));
        return Convert.ToBase64String(hash);
    }

    private static bool IsPasswordStrong(string? password)
    {
        if (string.IsNullOrWhiteSpace(password) || password.Length < 8)
            return false;

        return password.Any(char.IsUpper)
            && password.Any(char.IsLower)
            && password.Any(char.IsDigit)
            && password.Any(ch => !char.IsLetterOrDigit(ch));
    }

    
}