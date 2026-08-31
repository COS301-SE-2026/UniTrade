using System.Text.Json;
using Modules.Disputes;
using Modules.Disputes.Models;
using Modules.Disputes.Models.Dto;
using Modules.Disputes.Repositories;
using Modules.Listings;
using Modules.Listings.Models.Dto;
using Modules.Listings.Repositories;
using Modules.Listings.Snapshot;
using Modules.Reservations.Repositories;
using Modules.SharedKernel;

namespace Modules.Disputes;

public class DisputeService : IDisputeService
{
    private readonly IReservationMembership _membership;
    private readonly IListingSnapshotService _snapshots;
    private readonly IDisputeRepository _disputes;
    private readonly IListingService _listings;
    private readonly IMeetupRepository _meetups;
    private readonly IListingRepository _listingRepository;

    //casesrepo

    private static readonly HashSet<string> _types = new(StringComparer.OrdinalIgnoreCase)
    {
        "listing_quality",
    };

    public DisputeService(
        IReservationMembership membership,
        IListingSnapshotService snapshots,
        IListingService listings,
        IDisputeRepository disputes,
        IMeetupRepository meetups,
        IListingRepository listingRepository
    )
    {
        _membership = membership;
        _snapshots = snapshots;
        _disputes = disputes;
        _listings = listings;
        _meetups = meetups;
        _listingRepository = listingRepository;
    }

    public async Task<FileDisputeResultDto> FileDisputeAsync(
        FileDisputeDto req,
        Guid filedByUserId,
        CancellationToken ct = default
    )
    {
        if (string.IsNullOrWhiteSpace(req.Type))
        {
            throw new DisputesException("invalid_dispute_type");
        }
        return req.Type.ToLowerInvariant() switch
        {
            "listing_quality" => await FileListingQualityAsync(req, filedByUserId, ct),
            //add no show , filereportlistings
            "no_show" => await FileNoShowAsync(req, filedByUserId, ct),
            "report_listing" => await FileReportListingAsync(req, filedByUserId, ct),
            _ => throw new DisputesException("invalid_dispute_type"),
        };
    }

    private async Task<FileDisputeResultDto> FileListingQualityAsync(
        FileDisputeDto req,
        Guid filedByUserId,
        CancellationToken ct
    )
    {
        if (req.ReservationId is null)
        {
            throw new DisputesException("reservation_id_required");
        }
        var reservationId = req.ReservationId.Value;
        var isParty = await _membership.IsPartyToAsync(reservationId, filedByUserId, ct);

        if (!isParty)
        {
            throw new DisputesException("forbidden");
        }
        var parties = await _membership.GetReservationPartiesAsync(reservationId, ct);

        if (filedByUserId != parties.BuyerId)
        {
            throw new DisputesException("forbidden");
        }

        var sellerRefusedPhotos = req.SellerRefusedPhotos ?? false;
        var photos = req.Photos ?? new List<string>();

        if (photos.Count == 0 && !sellerRefusedPhotos)
        {
            throw new DisputesException("photos_required");
        }

        var snapshot = await _snapshots.GetByReservationIdAsync(reservationId, ct);
        if (snapshot is null)
        {
            throw new DisputesException("snapshot_not found");
        }

        await GuardOneOpenDisputeAsync(filedByUserId, parties.SellerId, ct);

        var caseId = await _disputes.CreateDisputeAsync(
            new Dispute
            {
                Type = "listing_quality",
                SubjectUserId = parties.SellerId,
                RaisedBy = filedByUserId,
                ReservationId = reservationId,
                ListingId = snapshot.Listing.ListingId,
                Photos = photos,
                SellerRefusedPhotos = sellerRefusedPhotos,
                Description = req.Description,
            },
            ct
        );
        return new FileDisputeResultDto(caseId);
    }

    private async Task<FileDisputeResultDto> FileNoShowAsync(
        FileDisputeDto req,
        Guid filedByUserId,
        CancellationToken ct
    )
    {
        if (req.ReservationId is null)
        {
            throw new DisputesException("reservation_id_required");
        }

        var reservationId = req.ReservationId.Value;

        var meetup =
            await _meetups.GetActiveByReservationAsync(reservationId, ct)
            ?? throw new DisputesException("meetup_not_found");

        var isParty = await _membership.IsPartyToAsync(reservationId, filedByUserId, ct);
        if (!isParty)
        {
            throw new DisputesException("forbidden");
        }

        var parties = await _membership.GetReservationPartiesAsync(reservationId, ct);
        var subjectUserId = (filedByUserId == parties.BuyerId) ? parties.SellerId : parties.BuyerId;

        var now = DateTime.UtcNow;
        if (meetup.CheckinWindowClosesAt == null || now <= meetup.CheckinWindowClosesAt)
        {
            throw new DisputesException("checkin_window_not_closed");
        }
        var currentUserCheckedIn = (filedByUserId == parties.BuyerId) ? meetup.BuyerCheckedIn : meetup.SellerCheckedIn;
        if (!currentUserCheckedIn)
        {
            throw new DisputesException("current_user_not_checked_in");
        }
        var otherUserCheckedIn = (subjectUserId == parties.BuyerId) ? meetup.BuyerCheckedIn : meetup.SellerCheckedIn;
        if (otherUserCheckedIn)
        {
            throw new DisputesException("other_party_checked_in");
        }
        await GuardOneOpenDisputeAsync(filedByUserId, subjectUserId, ct);

        var caseId = await _disputes.CreateDisputeAsync(
            new Dispute
            {
                Type = "no_show",
                SubjectUserId = subjectUserId,
                RaisedBy = filedByUserId,
                ReservationId = reservationId,
                Description = req.Description,
                MeetupId = meetup.MeetupId,
            },
            ct
        );
        return new FileDisputeResultDto(caseId);
    }

    public Task<IReadOnlyList<CaseSummaryDto>> ListPendingAsync(
        string? type,
        CancellationToken ct = default
    )
    {
        return _disputes.ListPendingAsync(type, ct); // where status in open , or under review order by the created at
    }

    public Task<DisputeCaseData?> GetCaseDataAsync(Guid disputeId, CancellationToken ct = default)
    {
        return _disputes.GetCaseDataAsync(disputeId, ct);
    }

    public async Task MarkResolvedAsync(
        Guid disputeId,
        Guid adminId,
        string status,
        CancellationToken ct = default
    )
    {
        await _disputes.MarkResolvedAsync(disputeId, adminId, status, ct);
    }

    private async Task<FileDisputeResultDto> FileReportListingAsync(
        FileDisputeDto req,
        Guid filedByUserId,
        CancellationToken ct
    )
    {
        if (req.ListingId is null)
        {
            throw new DisputesException("listing_id_required");
        }
        if (string.IsNullOrWhiteSpace(req.Description))
        {
            throw new DisputesException("report_reason_required");
        }

        var listing =
            await _listingRepository.GetByIdAsync(req.ListingId.Value)
            ?? throw new DisputesException("listing_not_found");

        if (!string.Equals(listing.ListingStatus, "live", StringComparison.OrdinalIgnoreCase))
        {
            throw new DisputesException("listing_not_live");
        }
        var snapshot = await _snapshots.CaptureForListingAsync(listing, ct);

        await GuardOneOpenDisputeAsync(filedByUserId, listing.SellerId, ct);

        var caseId = await _disputes.CreateDisputeAsync(
            new Dispute
            {
                Type = "report_listing",
                SubjectUserId = listing.SellerId,
                RaisedBy = filedByUserId,
                Description = req.Description,
                ListingId = listing.ListingId,
                SnapshotId = snapshot.SnapshotId,
            },
            ct
        );
        return new FileDisputeResultDto(caseId);
    }

    private async Task GuardOneOpenDisputeAsync(
        Guid filedByUserId,
        Guid subjectUserId,
        CancellationToken ct
    )
    {
        var hasOpen = await _disputes.HasOpenDisputeAsync(filedByUserId, subjectUserId, ct);
        if (hasOpen)
        {
            throw new DisputesException("dispute_already_open");
        }
    }
}
