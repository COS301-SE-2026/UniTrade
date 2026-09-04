using Modules.Listings.Models.Dto;
using Modules.Listings.Models;

namespace Modules.Listings.Snapshot;

public interface IListingSnapshotService
{
    Task<ListingSnapshotDto> CreateSnapshotAsync(Guid reservationId, Listing listing, CancellationToken ct = default);
    Task<ListingSnapshotDto?> GetByReservationIdAsync(Guid reservationId, CancellationToken ct = default);
    Task<ListingSnapshotDto?> CaptureForListingAsync(Listing listing, CancellationToken ct = default);
    Task<ListingSnapshotDto?> GetByIdAsync(Guid snapshotId, CancellationToken ct = default);


}
