using System.Collections.Concurrent;
using Modules.Notifications;

namespace Infrastructure.Notifications;

public class TestEmailService : IEmailService
{
    private static readonly ConcurrentDictionary<string, string> _lastOtps = new();

    public Task SendOtpEmailAsync(string email, string otp)
    {
        _lastOtps[email.ToLowerInvariant()] = otp;
        return Task.CompletedTask;
    }

    public Task SendWelcomeEmailAsync(string toEmail, string firstName) => Task.CompletedTask;

    public static string? GetLastOtp(string email) =>
        _lastOtps.TryGetValue(email.ToLowerInvariant(), out var otp) ? otp : null;
}
