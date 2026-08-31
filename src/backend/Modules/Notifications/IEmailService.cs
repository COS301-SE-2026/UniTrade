namespace Modules.Notifications;

public interface IEmailService
{
    Task SendOtpEmailAsync(string email, string otp);
    Task SendWelcomeEmailAsync(string toEmail, string firstName);
    Task SendVerificationDecisionEmailAsync(
        string toEmail,
        string firstName,
        string decision,
        string? reason = null
    );
}
