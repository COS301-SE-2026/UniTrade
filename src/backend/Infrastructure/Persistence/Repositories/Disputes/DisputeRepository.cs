using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Modules.Disputes.Models;
using Modules.Disputes.Models.Dto;
using Modules.Disputes.Repositories;
using Modules.Identity.Models;

namespace Infrastructure.Persistence.Repositories.Disputes;

public class DisputeRepository : IDisputeRepository
{
    private readonly AppDbContext _db;

    public DisputeRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<CaseSummaryDto>> ListPendingAsync(
        string? type,
        CancellationToken ct = default
    )
    {
        var query = _db.Disputes.Where(d => d.Status == "open" || d.Status == "under_review");
        if (!string.IsNullOrWhiteSpace(type))
        {
            query = query.Where(d => d.Type == type);
        }
        var disputes = await query.ToListAsync(ct);
        var results = new List<CaseSummaryDto>(disputes.Count);

        foreach (var d in disputes)
        {
            results.Add(await BuildSummaryAsync(d, ct));
        }
        return results;
    }

    public async Task<DisputeCaseData?> GetCaseDataAsync(
        Guid disputeId,
        CancellationToken ct = default
    )
    {
        var d = await _db.Disputes.FirstOrDefaultAsync(x => x.DisputeId == disputeId, ct);
        if (d is null)
        {
            return null;
        }
        var parties = await ResolvePartiesAsync(d, ct);

        var data = new DisputeCaseData
        {
            DisputeId = d.DisputeId,
            Type = d.Type,
            Status = d.Status,
            SubjectUserId = d.SubjectUserId,
            ReservationId = d.ReservationId,
            ListingId = d.ListingId,
            SellerRefusedPhotos = d.SellerRefusedPhotos,
            Photos = d.Photos ?? new List<string>(),
            Description = d.Description,
            SubmittedAt = d.SubmittedAt,
            SnapshotId = d.SnapshotId,
            RaisedBy = d.RaisedBy ?? Guid.Empty,
            BuyerId = parties.BuyerId,
            SellerId = parties.SellerId,
        };

        //no show dispute
        if (d.Type == "no_show" && d.MeetupId is not null)
        {
            var meetup = await _db.Meetups.FirstOrDefaultAsync(m => m.MeetupId == d.MeetupId, ct);
            if (meetup is not null)
            {
                data.BuyerCheckedIn = meetup.BuyerCheckedIn;
                data.BuyerCheckInTime = meetup.BuyerCheckinTime;
                data.SellerCheckedIn = meetup.SellerCheckedIn;
                data.SellerCheckInTime = meetup.SellerCheckinTime;
                data.CheckInWindowClosesAt = meetup.CheckinWindowClosesAt;
            }
            if (d.ReservationId is not null)
            {
                var txn = await _db
                    .Transactions.Where(t => t.ReservationId == d.ReservationId)
                    .OrderByDescending(t => t.CreatedAt)
                    .FirstOrDefaultAsync(ct);
                data.PinStatus = txn?.PinStatus;
            }
        }
        return data;
    }

    public async Task MarkResolvedAsync(
        Guid disputeId,
        Guid adminId,
        string resolution,
        CancellationToken ct = default
    )
    {
        var d = await _db.Disputes.FirstOrDefaultAsync(x => x.DisputeId == disputeId, ct);
        if (d is null)
        {
            return;
        }
        d.Status = string.Equals(resolution, "dismiss", StringComparison.OrdinalIgnoreCase)
            ? "closed"
            : "resolved";
        d.AssignedAdminId = adminId;
        d.Resolution = resolution;
        d.ResolvedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
    }
    public async Task<Guid> CreateDisputeAsync(Dispute dispute, CancellationToken ct = default)
    {
        dispute.DisputeId = Guid.NewGuid();
        dispute.Status = "open";
        dispute.SubmittedAt = DateTime.UtcNow;

        _db.Disputes.Add(dispute);
        await _db.SaveChangesAsync(ct);

        return dispute.DisputeId;
    }

    public async Task<bool> HasOpenDisputeAsync(
        Guid filedByUserId,
        Guid subjectUserId,
        CancellationToken ct = default
    )
    {
        return await _db.Disputes.AnyAsync(
            d =>
                d.RaisedBy == filedByUserId
                && d.SubjectUserId == subjectUserId
                && (d.Status == "open" || d.Status == "under_review"),
            ct
        );
    }

    private async Task<(Guid? BuyerId, Guid? SellerId)> ResolvePartiesAsync(
        Dispute d,
        CancellationToken ct
    )
    {
        if (d.ReservationId is null)
        {
            return (null, null);
        }
        var reservation = await _db.Reservations.FirstOrDefaultAsync(
            r => r.ReservationId == d.ReservationId,
            ct
        );
        return reservation is null ? (null, null) : (reservation.BuyerId, reservation.SellerId);
    }

    private async Task<CaseSummaryDto> BuildSummaryAsync(Dispute d, CancellationToken ct)
    {
        var parties = await ResolvePartiesAsync(d, ct);
        var buyerId = parties.BuyerId;
        var sellerId = parties.SellerId;

        string? title = null;
        if (d.ReservationId is not null)
        {
            var snapshot = await _db.ListingSnapshot.FirstOrDefaultAsync(
                s => s.ReservationId == d.ReservationId,
                ct
            );
            title = snapshot?.Title;
        }

        if (title is null && d.ListingId is not null)
        {
            title = await _db
                .Listings.Where(l => l.ListingId == d.ListingId)
                .Select(l => l.Title)
                .FirstOrDefaultAsync(ct);
        }
        var subject = await _db.Users.FirstOrDefaultAsync(u => u.UserId == d.SubjectUserId, ct);
        var subjectInitials = Initials(subject);

        Guid? counterpartyId = null;
        if (buyerId is not null && sellerId is not null)
        {
            counterpartyId = (d.SubjectUserId == sellerId) ? buyerId : sellerId;
        }
        User? counterparty = null;
        if (counterpartyId is not null)
        {
            counterparty = await _db.Users.FirstOrDefaultAsync(u => u.UserId == counterpartyId, ct);
        }
        var counterpartyInitials = Initials(counterparty);

        return new CaseSummaryDto
        {
            CaseId = d.DisputeId,
            Type = d.Type,
            Status = d.Status,
            SubjectUserId = d.SubjectUserId,
            SubmittedAt = d.SubmittedAt,
            AgeHours = 0,
            SlaHours = 0,
            SlaBreached = false,
            Title = title,
            SubjectInitials = subjectInitials,
            CounterpartyInitials = counterpartyInitials,
            RaisedBy = d.RaisedBy ?? Guid.Empty,
            BuyerId = buyerId,
            SellerId = sellerId,
            ReservationId = d.ReservationId,
            ListingId = d.ListingId,
        };
    }

    private static string? Initials(User? u) =>
        u is null ? null : $"{FirstChar(u.FirstName)}{FirstChar(u.LastName)}";

    private static string FirstChar(string? s) =>
        string.IsNullOrEmpty(s) ? string.Empty : s[0].ToString().ToUpperInvariant();
}
