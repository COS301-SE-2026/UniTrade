using Modules.Audit;
using Modules.Disputes.Models.Dto;
using Modules.Identity.Models.Dto;
using Modules.Identity.Verification;
using Modules.Listings.Models.Dto;
using Modules.Listings.Snapshot;
using Modules.Notifications;

namespace Modules.Disputes;

public sealed class DisputesException(string code) : Exception(code) { }

public class AdminCaseService : IAdminCaseService
{
    private readonly IVerificationService _verification;
    private readonly INotificationDispatcher _notifications;
    private readonly TimeProvider _clock;
    private readonly ICaseOutcomeApplier _outcomes;
    private readonly IAuditService _audit;
    private readonly IDisputeService _disputes;
    private readonly IListingSnapshotService _snapshots;

    // constants
    private const string _resolvedString = "resolved";
    private const string _underReviewString = "under_review";
    private const string _pendingString = "pending";

    public AdminCaseService(
        IVerificationService verification,
        INotificationDispatcher notifications,
        TimeProvider clock,
        ICaseOutcomeApplier outcomes,
        IAuditService audit,
        IDisputeService disputes,
        IListingSnapshotService snapshots
    )
    {
        _verification = verification;
        _notifications = notifications;
        _clock = clock;
        _outcomes = outcomes;
        _audit = audit;
        _disputes = disputes;
        _snapshots = snapshots;
    }

    public async Task<IReadOnlyList<CaseSummaryDto>> ListCasesAsync(
        string? type,
        string? status,
        CancellationToken ct = default
    )
    {
        var res = new List<CaseSummaryDto>();

        if (type is not null && type != "verification")
        {
            res.AddRange((await _verification.ListPendingAsync(ct)).Select(MapToSummary));
        }
        if (type is null or "listing_quality" or "no show" or "report_listing")
        {
            res.AddRange(await _disputes.ListPendingAsync(type, ct)); // empty till the BE2 dispute ready
        }
        return res.OrderBy(c => c.SubmittedAt).ToList(); // NOTE TO FUTURE SELF(ZS): TESTING QR 7A
    }

    public async Task<CaseDetailDto?> GetCaseByIdAsync(Guid caseId, CancellationToken ct = default)
    {
        var verificationCase = await _verification.GetCaseAsync(caseId, ct);
        if (verificationCase is not null)
        {
            return ToDetail(verificationCase);
        }
        var dispute = await _disputes.GetCaseDataAsync(caseId, ct); //also waiting on BE2 disputes to be ready

        return dispute is null ? null : await ToDisputeDetailAsync(dispute, ct);
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
        // verification cases
        var verificationCase = await _verification.GetCaseAsync(caseId, ct);

        if (verificationCase is not null)
        {
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
        // dispute cases

        var disputeData = await _disputes.GetCaseDataAsync(caseId, ct);
        if (disputeData is null)
        {
            return null;
        }

        if (
            decision
            is DisputeCaseDecision.Approve
                or DisputeCaseDecision.Reject
                or DisputeCaseDecision.Resubmit
        )
        {
            throw new DisputesException("decision_not_allowed");
        }

        var finalOutcomes = outcomes;
        if (disputeData.Type == "listing_quality")
        {
            var snapshot = disputeData.ReservationId is null
                ? null
                : await _snapshots.GetByReservationIdAsync(disputeData.ReservationId.Value, ct);

            var verdict = ListingQualityEvaluator.Evaluate(
                snapshot,
                disputeData.Photos,
                disputeData.SellerRefusedPhotos
            );

            if (decision != verdict.Decision)
            {
                throw new DisputesException("decision_contradicts_evidence");
            }
            finalOutcomes = verdict.Outcomes;
        }

        // the no show, report listing, outcomes come form the request as they are

        await ApplyDisputeDecisionAsync(
            disputeData.DisputeId,
            disputeData.SubjectUserId,
            disputeData.ListingId,
            decision,
            finalOutcomes,
            request.Reason,
            adminId,
            ct
        );

        return await GetCaseByIdAsync(caseId, ct);
    }

    private async Task ApplyDisputeDecisionAsync(
        Guid caseId,
        Guid subjectUserId,
        Guid? listingId,
        DisputeCaseDecision decision,
        IReadOnlyList<DisputeOutcome> outcomes,
        string? reason,
        Guid adminId,
        CancellationToken ct = default
    )
    {
        if (decision == DisputeCaseDecision.Uphold)
        {
            await _outcomes.ApplyAsync(
                outcomes,
                new CaseOutcomeContext(caseId, subjectUserId, listingId, adminId, reason),
                ct
            );
        }

        var applied =
            outcomes.Count == 0
                ? decision.ToString().ToLowerInvariant()
                : $"{decision.ToString().ToLowerInvariant()}: {string.Join(", ", outcomes)}";

        var auditRequest = new AuditWriteRequest(
            ActorId: adminId,
            Action: "dispute_decision",
            EntityType: "dispute",
            EntityId: caseId.ToString(),
            OldValue: null,
            NewValue: applied,
            Reason: reason
        );
        await _audit.WriteAsync(auditRequest, ct);

        await _notifications.NotifyAsync(
            subjectUserId,
            NotificationTypes.Dispute,
            "An admin has made a decision on your case.",
            ct
        );
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
            null => caseDto.Status == _underReviewString ? _underReviewString : _pendingString,
            "approved" => _resolvedString,
            "rejected" => _resolvedString,
            "resubmission" => "dismissed",
            _ => _pendingString,
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

    private async Task<CaseDetailDto> ToDisputeDetailAsync(DisputeCaseData d, CancellationToken ct)
    {
        ListingSnapshotDto? snapshot = d.ReservationId is null
            ? null
            : await _snapshots.GetByReservationIdAsync(d.ReservationId.Value, ct);

        return new CaseDetailDto
        {
            CaseId = d.DisputeId,
            Type = d.Type,
            Status = MapDisputeStatus(d.Status),
            SubjectUserId = d.SubjectUserId,
            SubmittedAt = d.SubmittedAt,
            AgeHours = Math.Round((_clock.GetUtcNow().UtcDateTime - d.SubmittedAt).TotalHours, 1),
            // will extend case detail dto with a listing quality/ no show evidence property just like hoe verification evidence hangs off it , and st here
            // snapshot, d.Photos, listing quality evidence has both of this
        };
    }

    private static string MapDisputeStatus(string s) =>
        s switch
        {
            "open" => _pendingString,
            _underReviewString => _underReviewString,
            "resolved" => _resolvedString,
            "closed" => "dismissed",
            _ => _pendingString,
        };
}
