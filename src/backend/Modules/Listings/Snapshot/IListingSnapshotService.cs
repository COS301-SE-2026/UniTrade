using Modules.Listings.Models.Dto;
using Modules.Listings.Models;

namespace Modules.Listings.Snapshot;

public interface IListingSnapshotRepository
{
    Task<ListingSnapshotDto> CreateSnapshotAsync(Guid reservationId,Listing listing, CancellationToken ct=default);
    Task <ListingSnapshotDto?> GetByReservationIdAsync(Guid reservationId, CancellationToken ct=default);
}