using Modules.Disputes.Models.Dto;
using Modules.Identity.Models.Dto;
using Modules.Identity.Verification;
using Modules.Notifications;

namespace Modules.Disputes;

public sealed class DisputesException(string code) : Exception(code) { }

public class AdminCaseService : IAdminCaseService
{
    private readonly IVerificationService _verification;
    private readonly INotificationDispatcher _notifications;
    private readonly TimeProvider _clock;

    public AdminCaseService(
        IVerificationService verification,
        INotificationDispatcher notifications,
        TimeProvider clock
    )
    {
        _verification = verification;
        _notifications = notifications;
        _clock = clock;
    }

    public async Task<IReadOnlyList<CaseSummaryDto>> ListCasesAsync(
        string? type,
        string? status,
        CancellationToken ct = default
    )
    {
        if (type is not null && type != "verification")
        {
            return Array.Empty<CaseSummaryDto>();
        }
        var pending = await _verification.ListPendingAsync(ct);
        return pending.Select(MapToSummary).ToList();
    }

    public async Task<CaseDetailDto?> GetCaseByIdAsync(Guid caseId, CancellationToken ct = default)
    {
        var verificationCase = await _verification.GetCaseAsync(caseId, ct);
        return verificationCase is null ? null : ToDetail(verificationCase);
    }

    public async Task<CaseDetailDto?> DecideCaseAsync(
        Guid caseId,
        DecisionRequestDto request,
        Guid adminId,
        CancellationToken ct = default
    )
    {
        var decision = DisputeDecisionMappings.Map(request.Decision);
        var outcomes = DisputeDecisionMappings.MappingOutcomes(request.Outcomes);

        if (decision != DisputeCaseDecision.Uphold && outcomes.Count > 0)
        {
            throw new DisputesException("outcomes_not_allowed");
        }
        if (decision == DisputeCaseDecision.Uphold && outcomes.Count == 0)
        {
            throw new DisputesException("outcomes_required");
        }
        // i only did verification only now
        var verificationCase = await _verification.GetCaseAsync(caseId, ct);

        if (verificationCase is null)
        {
            return null;
        }

        var verificationDecision = decision switch
        {
            DisputeCaseDecision.Approve => VerificationDecision.Approve,
            DisputeCaseDecision.Reject => VerificationDecision.Reject,
            DisputeCaseDecision.Resubmit => VerificationDecision.Resubmit,
            _ => throw new DisputesException("decision_not_allowed"),
        };

        var updatedVerificationRecord = await _verification.DecideAsync(
            caseId,
            adminId,
            verificationDecision,
            request.Reason,
            ct
        );
        if (updatedVerificationRecord is null)
        {
            return null;
        }

        await _notifications.NotifyAsync(
            updatedVerificationRecord.UserId,
            NotificationTypes.Verification,
            DecisionMessage(verificationDecision),
            ct
        );

        return ToDetail(updatedVerificationRecord);
    }

    private CaseSummaryDto MapToSummary(VerificationCaseDto caseDto) =>
        new()
        {
            CaseId = caseDto.VerificationId,
            Type = "verification",
            Status = MapStatus(caseDto),
            SubjectUserId = caseDto.UserId,
            SubmittedAt = caseDto.SubmittedAt,
            AgeHours = Math.Round(
                (_clock.GetUtcNow().UtcDateTime - caseDto.SubmittedAt).TotalHours,
                1
            ),
        };

    private CaseDetailDto ToDetail(VerificationCaseDto caseDto) =>
        new()
        {
            CaseId = caseDto.VerificationId,
            Type = "verification",
            Status = MapStatus(caseDto),
            SubjectUserId = caseDto.UserId,
            SubmittedAt = caseDto.SubmittedAt,
            AgeHours = Math.Round(
                (_clock.GetUtcNow().UtcDateTime - caseDto.SubmittedAt).TotalHours,
                1
            ),
            Evidence = new VerificationEvidenceDto
            {
                University = caseDto.University,
                Degree = caseDto.Degree,
                Year = caseDto.Year,
                Email = caseDto.Email,
            },
        };

    private static string MapStatus(VerificationCaseDto caseDto) =>
        caseDto.AdminDecision switch
        {
            null => caseDto.Status == "under_review" ? "under_review" : "pending",
            "approved" => "resolved",
            "rejected" => "resolved",
            "resubmission" => "dismissed",
            _ => "pending",
        };

    private static string DecisionMessage(VerificationDecision decision) =>
        decision switch
        {
            VerificationDecision.Approve =>
                "Your student verification has been approved. You can now publish listings.",
            VerificationDecision.Reject => "Your student verification was not approved.",
            VerificationDecision.Resubmit => "Please resubmit your student verification.",
            _ => "Your verification status was updated.",
        };
}
