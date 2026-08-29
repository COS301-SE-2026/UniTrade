using Modules.Audit;
using Modules.Disputes.Models.Dto;
using Modules.Identity;
using Modules.Identity.Models.Dto;
using Modules.Identity.Verification;
using Modules.Listings.Models.Dto;
using Modules.Listings.Snapshot;
using Modules.Notifications;
using Modules.Reputation;

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
    private readonly IPartDirectory _parties;
    private readonly IReputationService _reputation;

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

        if (type is null or "verification")
        {
            res.AddRange((await _verification.ListPendingAsync(ct)).Select(MapToSummary));
        }
        if (type is null or "listing_quality" or "no_show" or "report_listing")
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
            return ToDetailAsync(verificationCase);
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

            return ToDetailAsync(updatedVerificationRecord);
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

    internal enum PartyRole
    {
        Buyer,
        Seller,
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

    private async Task<CaseDetailDto> ToDetailAsync(
        VerificationCaseDto caseDto,
        CancellationToken ct
    ) =>
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
            Subject = await BuildPartyAsync(caseDto.UserId, PartyRole.Seller, ct),
            FiledByUserId = caseDto.UserId,
            FiledByRole = "applicant",
            Evidence = new CaseEvidenceDto
            {
                University = caseDto.University,
                Degree = caseDto.Degree,
                Year = caseDto.Year,
                Email = caseDto.Email,
                DomainValid = true,
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

        var subject = await BuildPartyAsync(d.SubjectUserId, RoleOf(d, d.SubjectUserId), ct);
        // for reporting a lsiting conunterparty s the rpeorter
        Guid? counterpartyId =
            d.Type == "report_listing" ? d.RaisedBy
            : d.SubjectUserId == d.SellerId ? d.BuyerId
            : d.SubjectUserId == d.BuyerId ? d.SellerId
            : null;
        if(counterpartyId == d.SubjectUserId) counterpartyId = null;

        var counterparty = counterpartyId is null? null: await BuildPartyAsync(counterpartyId.Value, RoleOd(d, counterpartyId.Value), ct);

        return new CaseDetailDto
        {
            CaseId = d.DisputeId,
            Type = d.Type,
            Status = MapDisputeStatus(d.Status),
            SubjectUserId = d.SubjectUserId,
            SubmittedAt = d.SubmittedAt,
            AgeHours = Math.Round((_clock.GetUtcNow().UtcDateTime - d.SubmittedAt).TotalHours, 1),
            Subject = subject,
            CounterParty = counterparty,
            FiledByUserId= d.RaisedBy,
            FiledByRole = d.RaisedBy== d.SellerId? "seller": d.RaisedBy== d.BuyerId? "buyer":"system",
            Evidence = BuildDisputeEvidence(d, snapshot);
        };
    }
    private static CaseEvidenceDto BuildDisputeEvidence(DisputeCaseData d, ListingSnapshotDto? snapshot) =>
    d.Type switch
    {
        "listing_quality" => new CaseEvidenceDto
        {
            Snapshot = snapshot,
            BuyerPhotos = d.Photos,
            SellerRefusedPhotos = d.SellerRefusedPhotos,
        },
        "report_listing"=> new CaseEvidenceDto
        {
            Snapshot = snapshot,
            ListingId= d.ListingId,
            ReportReason = d.Description,
        },
        "no_show"=> new CaseEvidenceDto
        {MeetupId = d.MeetupId,
        BuyerCheckedIn= d.BuyerCheckedIn,
        BuyerCheckInTime= d.BuyerCheckInTime,
        SellerCheckedIn= d.SellerCheckedIn,
        SellerCheckInTime= d.SellerCheckInTime,
        PinStatus= d.PinStatus,
        CheckInWindowClosesAt= d.CheckInWindowClosesAt,
        
            
        },
        _ => new CaseEvidenceDto(),
    };

    private double Age(DateTime submittedAt)=>
    Math.Round((_clock.GetUtcNow().UtcDateTime - submittedAt).TotalHours, 1);

    private static PartyRole RoleOf(DisputeCaseData d, Guid userId)=>
    userId== d.BuyerId ? PartyRole.Buyer : PartyRole.Seller;
    
    private async Task<PartySummaryDto> BuildPartyAsync(Guid userId, PartyRole role, CancellationToken ct)
    {
        var p = await _parties.GetAsync(userId, ct);
        if(p is null)
        {
            return null;
        }
        var strikes = await _reputation.GetStrikesAsync(userId, ct);
            var score = role == PartyRole.Buyer? p.BuyerReliabilityScore: p.SellerTrustScore;
            
            return new PartySummaryDto
            {
                UserId =p.UserId,
                Name=$"{p.FirstName} {p.LastName}".Trim(),
                Initials = MakeInitials(p.FirstName, p.LastName),
                Faculty= p.University,
                ReviewAverage= (double)score,
                ReputationScore = Math.Round(score/5m* 100m),
                StrikeCount =strikes.Count,

            };

    }
    private static string MakeInitials(string first, string last)
    {
        var firstName = string.IsNullOrEmpty(first)? "":first[..1];
        var lastName = string.IsNullOrEmpty(last)? "":last[..1];
        return(firstName+lastName).ToUpperInvariant();
        
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
