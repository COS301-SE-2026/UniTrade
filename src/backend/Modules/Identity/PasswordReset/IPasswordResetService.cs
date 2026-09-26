namespace Modules.Identity.PasswordReset;

public interface IPasswordResetService
{
    Task InitiateAsync(string email);
    Task VerifyOtpAsync(string email, string otp);
    Task ResetPasswordAsync(string email, string otp, string newPassword);
}