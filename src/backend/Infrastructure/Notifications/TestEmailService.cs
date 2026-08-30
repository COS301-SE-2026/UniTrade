using System.Collections.Concurrent;
using Modules.Notifications;

namespace Infrastructure.Notifications;

public class TestEmailService : IEmailService
{
    private static readonly ConcurrentDictionary<string, string> _lastOtps = new();
    private static readonly ConcurrentDictionary<string, string> _lastDecisions = new();

    public Task SendOtpEmailAsync(string email, string otp)
    {
        _lastOtps[email.ToLowerInvariant()] = otp;
        return Task.CompletedTask;
    }

    public Task SendWelcomeEmailAsync(string toEmail, string firstName) => Task.CompletedTask;

    public Task SendVerificationDecisionEmailAsync(
        string toEmail,
        string firstName,
        string decision,
        string? reason = null
    )
    {
        _lastDecisions[toEmail.ToLowerInvariant()] = decision;
        Console.WriteLine(
            $"[TestEmailService] Verification decision email to {toEmail}: {decision}"
            + (reason is not null ? $" ({reason})" : "")
        );

        return Task.CompletedTask;
    }

    public static string? GetLastOtp(string email) =>
        _lastOtps.TryGetValue(email.ToLowerInvariant(), out var otp) ? otp : null;
    public static string? GetLastDecision(string email) =>
        _lastDecisions.TryGetValue(email.ToLowerInvariant(), out var decision) ? decision : null;
}
