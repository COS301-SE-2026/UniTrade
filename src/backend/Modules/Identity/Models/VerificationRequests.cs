namespace Modules.Identity.Models;

public class VerificationRequest
{
    public Guid VerificationId { get; set; }
    public Guid UserId { get; set; }

    public int AttemptNumber { get; set; } = 0;
    public int? TotalAttemptCount { get; set; } = 0;
    public DateTime? LastAttemptAt { get; set; }

    public bool IsCurrent { get; set; } = true;

    public string? OtpCodeHash { get; set; }
    public DateTime? OtpSentAt { get; set; }

    public DateTime OtpExpiresAt { get; set; }
    public DateTime? OtpVerifiedAt { get; set; }
    public int? OtpResendCount { get; set; } = 0;

    public string? PorFilePath { get; set; }
    public decimal? AiConfidenceScore { get; set; }
    public string? AiDecision { get; set; }


    public Guid? AdminId { get; set; }
    public string? AdminDecision { get; set; }
    public string? RejectionReason { get; set; }

    public string Status { get; set; } = "otp_pending";

    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DecidedAt { get; set; }

}