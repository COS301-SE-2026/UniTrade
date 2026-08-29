using System.Text.Json;
using Modules.Disputes.Models.Dto;
using Modules.Listings.Snapshot;
using Modules.Disputes.Repositories;
using Modules.SharedKernel;

namespace Modules.Disputes;

public class DisputesService : IDisputesService
{
    private readonly IReservationMembership _membership;
    private readonly IListingSnapshotService _snapshots;
    private readonly ICaseRepository _cases;
    //casesrepo

    private static readonly HashSet<string> _types = new(StringComparer.OrdinalIgnoreCase)
    {
        "listing_quality"
    };

    public DisputesService(IReservationMembership membership, IListingSnapshotService snapshots, ICaseRepository cases)
    {
        _membership = membership;
        _snapshots = snapshots;
        _cases = cases;
    }

    public async Task<FileDisputeResultDto> FileDisputeAsync(FileDisputeDto req, Guid filedByUserId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(req.Type))
        {
            throw new DisputesException("invalid_dispute_type");
        }
        if (!_types.Contains(req.Type))
        {
            //ps no show and report listings have their ownnnn, dont put them together(breaks our arch)
            throw new DisputesException("invalid_dispute_type");
        }
        return req.Type.ToLowerInvariant() switch
        {
            "listing_quality" => await FileListingQualityAsync(req, filedByUserId, ct),
            _ => throw new DisputesException("invalid_dispute_type"),
        };
    }

    private async Task<FileDisputeResultDto> FileListingQualityAsync(FileDisputeDto req, Guid filedByUserId, CancellationToken ct)
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

        var snapshot = await _snapshots.GetByReservationIdAsync(reservationId, ct);
        if (snapshot is null)
        {
            throw new DisputesException("snapshot_not found");
        }

        var evidence = new
        {
            snapshot,
            photos = req.Photos ?? new List<string>(),
            sellerRefusedPhotos = req.SellerRefusedPhotos ?? false,
        };

        var evidenceJson = JsonSerializer.Serialize(evidence);
        var caseId = await _cases.CreateCaseAsync(
            caseType: "listing_quality",
            subjectUserId: parties.SellerId,
            filedByUserId: filedByUserId,
            evidenceJson: evidenceJson,
            description: req.Description,
            ct: ct
        );
        return new FileDisputeResultDto(caseId);

    }
}
