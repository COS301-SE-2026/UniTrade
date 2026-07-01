namespace Modules.Identity.Verification;

public interface IVerificationService
{
    Task InitiateAsync(string email, Guid userId);
    Task<bool> VerifyAsync(Guid userId, string otp);
    Task ResendAsync(Guid userId, string email);
}
