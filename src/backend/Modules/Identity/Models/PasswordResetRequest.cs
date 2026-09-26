namespace Modules.Identity.Models;

public class PasswordResetRequest
{
    public Guid PasswordResetRequestId { get; set;}
    public Guid UserId {get; set;}

    public string OtpCodeHash { get; set;} = null!;
    public DateTime OtpSentAt {get; set;} = DateTime.UtcNow;
    public DateTime OtpExpiresAt {get; set;}
    public DateTime? OtpVerifiedAt {get; set;}

    public int AttemptNumber {get; set;} = 0;
    public bool IsCurrent {get; set;} = true;
}