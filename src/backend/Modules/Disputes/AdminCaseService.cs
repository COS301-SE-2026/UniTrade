using Microsoft.EntityFrameworkCore.ChangeTracking.Internal;
using Modules.Audit;
using Modules.Disputes.Models.Dto;
using Modules.Disputes.Repositories;
using Modules.Identity;
using Modules.Identity.Models.Dto;
using Modules.Identity.Verification;
using Modules.Listings;
using Modules.Listings.Models.Dto;
using Modules.Listings.Snapshot;
using Modules.Notifications;
using Modules.Reputation;
using Modules.Reservations;

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
    private readonly IPartyDirectory _parties;
    private readonly IReputationService _reputation;
    private readonly IListingService _listings;
    private readonly IBroadCastService _broadcast;

    // Constants
    private const string ResolvedString = "resolved";
    private const string UnderReviewString = "under_review";
    private const string PendingString = "pending";
    private const string VerificationString = "verification";
    private const string ReportListingString = "report_listing";
    private const string ListingQualityString = "listing_quality";
    private const string NoShowString = "no_show";
    private const string DismissedString = "dismissed";

    public AdminCaseService(
        IVerificationService verification,
        INotificationDispatcher notifications,
        TimeProvider clock,
        ICaseOutcomeApplier outcomes,
        IAuditService audit,
        IDisputeService disputes,
        IListingSnapshotService snapshots,
        IPartyDirectory parties,
        IReputationService reputation,
        IListingService listings,
        IBroadCastService broadcast
    )
    {
        _verification = verification;
        _notifications = notifications;
        _clock = clock;
        _outcomes = outcomes;
        _audit = audit;
        _disputes = disputes;
        _snapshots = snapshots;
        _parties = parties;
        _reputation = reputation;
        _listings = listings;
        _broadcast = broadcast;
    }

    public async Task<IReadOnlyList<CaseSummaryDto>> ListCasesAsync(
        string? type,
        string? status,
        CancellationToken ct = default
    )
    {
        var res = new List<CaseSummaryDto>();

        // 1. Verification Cases
        if (type is null or VerificationString)
        {
            var verificationCases = await _verification.ListPendingAsync(ct);
            var mappedVerification = verificationCases
                .Select(MapToSummary)
                .Where(c => string.IsNullOrEmpty(status) || c.Status.Equals(status, StringComparison.OrdinalIgnoreCase));
            
            res.AddRange(mappedVerification);
        }

        // 2. Dispute Cases
        if (type is null or ListingQualityString or NoShowString or ReportListingString)
        {
            var disputeItems = await _disputes.ListPendingAsync(type, ct);

            var subjectUserIds = disputeItems.Select(i => i.SubjectUserId).Distinct().ToList();
            var counterpartyIds = disputeItems
                .Select(i => new
                {
                    SubjectId = i.SubjectUserId,
                    CounterpartyId = i.Type == ReportListingString ? i.RaisedBy
                        : i.SubjectUserId == i.SellerId ? i.BuyerId
                        : i.SubjectUserId == i.BuyerId ? i.SellerId
                        : (Guid?)null,
                })
                .Where(x => x.CounterpartyId.HasValue && x.CounterpartyId.Value != x.SubjectId)
                .Select(x => x.CounterpartyId!.Value)
                .Distinct()
                .ToList();

            var reservationIds = disputeItems
                .Where(i => i.ReservationId.HasValue)
                .Select(i => i.ReservationId!.Value)
                .Distinct()
                .ToList();

            // Populate Dictionaries in parallel / async tasks
            var subjectDict = (await Task.WhenAll(subjectUserIds.Select(async id => new { Id = id, Party = await _parties.GetAsync(id, ct) })))
                .Where(x => x.Party != null)
                .ToDictionary(x => x.Id, x => x.Party!);

            var counterpartyDict = (await Task.WhenAll(counterpartyIds.Select(async id => new { Id = id, Party = await _parties.GetAsync(id, ct) })))
                .Where(x => x.Party != null)
                .ToDictionary(x => x.Id, x => x.Party!);

            var snapshotDict = (await Task.WhenAll(reservationIds.Select(async resId => new { ResId = resId, Snapshot = await _snapshots.GetByReservationIdAsync(resId, ct) })))
                .Where(x => x.Snapshot != null)
                .ToDictionary(x => x.ResId, x => x.Snapshot!);

            var listingIds = disputeItems
                .Where(i => i.ListingId.HasValue && !i.ReservationId.HasValue)
                .Select(i => i.ListingId!.Value)
                .Distinct()
                .ToList();

            var listingTitleDict = (await Task.WhenAll(listingIds.Select(async lid => new { ListingId = lid, Listing = await _listings.GetByIdAsync(lid) })))
                .Where(x => x.Listing != null)
                .ToDictionary(x => x.ListingId, x => x.Listing!.Title);

            var mappedDisputes = disputeItems
                .Select(item =>
                {
                    var ageHours = Math.Round(
                        (_clock.GetUtcNow().UtcDateTime - item.SubmittedAt).TotalHours,
                        1
                    );
                    var (slaHours, slaBreached) = Sla(item.Type, ageHours);
                    var subjectInitials = subjectDict.TryGetValue(item.SubjectUserId, out var subject)
                        ? MakeInitials(subject.FirstName, subject.LastName)
                        : "??";

                    Guid? counterpartyId =
                        item.Type == ReportListingString ? item.RaisedBy
                        : item.SubjectUserId == item.SellerId ? item.BuyerId
                        : item.SubjectUserId == item.BuyerId ? item.SellerId
                        : null;

                    if (counterpartyId == item.SubjectUserId)
                    {
                        counterpartyId = null;
                    }

                    var counterpartyInitials = counterpartyId.HasValue && counterpartyDict.TryGetValue(counterpartyId.Value, out var cp)
                        ? MakeInitials(cp.FirstName, cp.LastName)
                        : "??";

                    string? title = null;
                    if (item.ReservationId.HasValue && snapshotDict.TryGetValue(item.ReservationId.Value, out var snap))
                    {
                        title = snap.Title;
                    }
                    if (title == null && item.ListingId.HasValue && listingTitleDict.TryGetValue(item.ListingId.Value, out var listTitle))
                    {
                        title = listTitle;
                    }

                    return new CaseSummaryDto
                    {
                        CaseId = item.CaseId,
                        Type = item.Type,
                        Status = MapDisputeStatus(item.Status),
                        SubjectUserId = item.SubjectUserId,
                        SubmittedAt = item.SubmittedAt,
                        AgeHours = ageHours,
                        SlaHours = slaHours,
                        SlaBreached = slaBreached,
                        Title = title ?? "Unknown listing",
                        SubjectInitials = subjectInitials,
                        CounterpartyInitials = counterpartyInitials,
                    };
                })
                .Where(c => string.IsNullOrEmpty(status) || c.Status.Equals(status, StringComparison.OrdinalIgnoreCase));

            res.AddRange(mappedDisputes);
        }

        return res.OrderBy(c => c.SubmittedAt).ToList();
    }

    public async Task<CaseDetailDto?> GetCaseByIdAsync(Guid caseId, CancellationToken ct = default)
    {
        var verificationCase = await _verification.GetCaseAsync(caseId, ct);
        if (verificationCase is not null)
        {
            return await ToDetailAsync(verificationCase, ct);
        }

        var dispute = await _disputes.GetCaseDataAsync(caseId, ct);
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

        // Check if verification case
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

            return await ToDetailAsync(updatedVerificationRecord, ct);
        }

        // Process dispute case
        var disputeData = await _disputes.GetCaseDataAsync(caseId, ct);
        if (disputeData is null)
        {
            return null;
        }

        if (decision is DisputeCaseDecision.Approve or DisputeCaseDecision.Reject or DisputeCaseDecision.Resubmit)
        {
            throw new DisputesException("decision_not_allowed");
        }

        var finalOutcomes = outcomes;
        if (disputeData.Type == ListingQualityString)
        {
            var snapshot = disputeData.ReservationId is null
                ? null
                : await _snapshots.GetByReservationIdAsync(disputeData.ReservationId.Value, ct);

            var verdict = ListingQualityEvaluator.Evaluate(
                snapshot,
                disputeData.Photos,
                disputeData.SellerRefusedPhotos
            );

            finalOutcomes = verdict.Outcomes;
        }

        if (decision == DisputeCaseDecision.Uphold && finalOutcomes.Count == 0)
        {
            finalOutcomes = new List<DisputeOutcome> { DisputeOutcome.Strike };
        }

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

        var resolvedStatus = decision == DisputeCaseDecision.Dismiss ? "dismiss" : ResolvedString;
        await _disputes.MarkResolvedAsync(
            disputeData.DisputeId,
            adminId,
            resolvedStatus,
            ct
        );

        await _broadcast.NotifyAdminAsync("dispute_resolved", new { caseId, status = decision == DisputeCaseDecision.Dismiss ? DismissedString : ResolvedString });

        return await GetCaseByIdAsync(caseId, ct);
    }

    internal enum PartyRole
    {
        Buyer,
        Seller,
    }

    private static int SlaHours(string caseType) =>
        caseType switch
        {
            VerificationString => 48,
            _ => 72,
        };

    private (int slaHours, bool breached) Sla(string type, double ageHours)
    {
        var sla = SlaHours(type);
        return (sla, ageHours > sla);
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

        var applied = outcomes.Count == 0
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

    private CaseSummaryDto MapToSummary(VerificationCaseDto caseDto)
    {
        var ageHours = Math.Round(
            (_clock.GetUtcNow().UtcDateTime - caseDto.SubmittedAt).TotalHours,
            1
        );
        var (slaHours, slaBreached) = Sla(VerificationString, ageHours);

        return new CaseSummaryDto
        {
            CaseId = caseDto.VerificationId,
            Type = VerificationString,
            Status = MapStatus(caseDto),
            SubjectUserId = caseDto.UserId,
            SubmittedAt = caseDto.SubmittedAt,
            AgeHours = ageHours,
            SlaHours = slaHours,
            SlaBreached = slaBreached,
            Title = caseDto.University,
            SubjectInitials = MakeInitials(caseDto.FirstName, caseDto.LastName),
            SubjectName = $"{caseDto.FirstName} {caseDto.LastName}".Trim(),
            SubjectDegree = caseDto.Degree,
            SubjectYear = caseDto.Year,
            CounterpartyInitials = null,
            HasDocument = caseDto.Status is UnderReviewString or "approved" or "rejected",
        };
    }

    private async Task<CaseDetailDto> ToDetailAsync(
        VerificationCaseDto caseDto,
        CancellationToken ct
    )
    {
        var ageHours = Math.Round(
            (_clock.GetUtcNow().UtcDateTime - caseDto.SubmittedAt).TotalHours,
            1
        );
        var (slaHours, slaBreached) = Sla(VerificationString, ageHours);
        var hasDocument = caseDto.Status is UnderReviewString or "approved" or "rejected";

        return new CaseDetailDto
        {
            CaseId = caseDto.VerificationId,
            Type = VerificationString,
            Status = MapStatus(caseDto),
            SubjectUserId = caseDto.UserId,
            SubmittedAt = caseDto.SubmittedAt,
            AgeHours = ageHours,
            SlaHours = slaHours,
            SlaBreached = slaBreached,
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
                ProofDocument = hasDocument ? "submitted" : null,
            },
        };
    }

    private static string MapStatus(VerificationCaseDto caseDto) =>
        caseDto.AdminDecision switch
        {
            null => caseDto.Status == UnderReviewString ? UnderReviewString : PendingString,
            "approved" => ResolvedString,
            "rejected" => ResolvedString,
            "resubmission" => DismissedString,
            _ => PendingString,
        };

    private static string DecisionMessage(VerificationDecision decision) =>
        decision switch
        {
            VerificationDecision.Approve => "Your student verification has been approved. You can now publish listings.",
            VerificationDecision.Reject => "Your student verification was not approved.",
            VerificationDecision.Resubmit => "Please resubmit your student verification.",
            _ => "Your verification status was updated.",
        };

    private async Task<CaseDetailDto> ToDisputeDetailAsync(DisputeCaseData d, CancellationToken ct)
    {
        ListingSnapshotDto? snapshot = null;
        if (d.Type == ReportListingString && d.SnapshotId.HasValue)
        {
            snapshot = await _snapshots.GetByIdAsync(d.SnapshotId.Value, ct);
        }
        else if (d.ReservationId.HasValue)
        {
            snapshot = await _snapshots.GetByReservationIdAsync(d.ReservationId.Value, ct);
        }

        var listingId = d.ListingId ?? snapshot?.ListingId;
        string? currentListingStatus = null;
        if (listingId.HasValue)
        {
            var listing = await _listings.GetByIdAsync(listingId.Value);
            currentListingStatus = listing?.ListingStatus;
        }

        var subject = await BuildPartyAsync(d.SubjectUserId, RoleOf(d, d.SubjectUserId), ct);

        Guid? counterpartyId =
            d.Type == ReportListingString ? d.RaisedBy
            : d.SubjectUserId == d.SellerId ? d.BuyerId
            : d.SubjectUserId == d.BuyerId ? d.SellerId
            : null;

        if (counterpartyId == d.SubjectUserId)
        {
            counterpartyId = null;
        }

        var counterparty = counterpartyId is null
            ? null
            : await BuildPartyAsync(counterpartyId.Value, RoleOf(d, counterpartyId.Value), ct);

        var ageHours = Age(d.SubmittedAt);
        var (slaHours, slaBreached) = Sla(d.Type, ageHours);

        string? suggestedDecision = null;
        List<string>? suggestedOutcomes = null;
        if (d.Type == ListingQualityString && snapshot != null)
        {
            var verdict = ListingQualityEvaluator.Evaluate(
                snapshot,
                d.Photos,
                d.SellerRefusedPhotos
            );
            suggestedDecision = verdict.Decision.ToString().ToLowerInvariant();
            suggestedOutcomes = verdict
                .Outcomes.Select(o => o.ToString().ToLowerInvariant())
                .ToList();
        }

        var filedByRole = d.Type == ReportListingString
            ? "reporter"
            : d.RaisedBy == d.SellerId ? "seller"
            : d.RaisedBy == d.BuyerId ? "buyer"
            : "unknown";

        return new CaseDetailDto
        {
            CaseId = d.DisputeId,
            Type = d.Type,
            Status = MapDisputeStatus(d.Status),
            SubjectUserId = d.SubjectUserId,
            SubmittedAt = d.SubmittedAt,
            AgeHours = ageHours,
            SlaHours = slaHours,
            SlaBreached = slaBreached,
            Subject = subject,
            CounterParty = counterparty,
            FiledByUserId = d.RaisedBy,
            FiledByRole = filedByRole,
            Evidence = BuildDisputeEvidence(d, snapshot, currentListingStatus),
            SuggestedDecision = suggestedDecision,
            SuggestedOutcomes = suggestedOutcomes,
        };
    }

    private static CaseEvidenceDto BuildDisputeEvidence(
        DisputeCaseData d,
        ListingSnapshotDto? snapshot,
        string? currentListingStatus
    ) =>
        d.Type switch
        {
            ListingQualityString => new CaseEvidenceDto
            {
                Snapshot = snapshot,
                BuyerPhotos = d.Photos,
                SellerRefusedPhotos = d.SellerRefusedPhotos,
                CurrentListingStatus = currentListingStatus,
            },
            ReportListingString => new CaseEvidenceDto
            {
                Snapshot = snapshot,
                ListingId = d.ListingId,
                ReportReason = d.Description,
                CurrentListingStatus = currentListingStatus,
            },
            NoShowString => new CaseEvidenceDto
            {
                MeetupId = d.MeetupId,
                BuyerCheckedIn = d.BuyerCheckedIn,
                BuyerCheckInTime = d.BuyerCheckInTime,
                SellerCheckedIn = d.SellerCheckedIn,
                SellerCheckInTime = d.SellerCheckInTime,
                PinStatus = d.PinStatus,
                CheckInWindowClosesAt = d.CheckInWindowClosesAt,
            },
            _ => new CaseEvidenceDto(),
        };

    private double Age(DateTime submittedAt) =>
        Math.Round((_clock.GetUtcNow().UtcDateTime - submittedAt).TotalHours, 1);

    private static PartyRole RoleOf(DisputeCaseData d, Guid userId) =>
        userId == d.BuyerId ? PartyRole.Buyer : PartyRole.Seller;

    private async Task<PartySummaryDto?> BuildPartyAsync(
        Guid userId,
        PartyRole role,
        CancellationToken ct
    )
    {
        var p = await _parties.GetAsync(userId, ct);
        if (p is null)
        {
            return null;
        }

        var strikes = await _reputation.GetStrikesAsync(userId, ct);
        var reputation = await _reputation.GetReputationSummaryAsync(userId, ct);

        return new PartySummaryDto
        {
            UserId = p.UserId,
            Name = $"{p.FirstName} {p.LastName}".Trim(),
            Initials = MakeInitials(p.FirstName, p.LastName),
            Faculty = p.University,
            ReviewAverage = reputation.AverageRating,
            ReputationScore = reputation.ReputationScore,
            StrikeCount = strikes.Count,
            ReviewCount = reputation.ReviewCount,
        };
    }

    private static string MakeInitials(string? first, string? last)
    {
        var firstName = string.IsNullOrEmpty(first) ? "" : first[..1];
        var lastName = string.IsNullOrEmpty(last) ? "" : last[..1];
        return (firstName + lastName).ToUpperInvariant();
    }

    private static string MapDisputeStatus(string s) =>
        s switch
        {
            "open" => PendingString,
            UnderReviewString => UnderReviewString,
            ResolvedString => ResolvedString,
            "closed" => DismissedString,
            _ => PendingString,
        };
}