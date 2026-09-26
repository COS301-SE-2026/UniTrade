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
}