using Modules.Listings.Models;
namespace Modules.Listings.Repositories;

public interface IListingSnapshotRepository
{
    Task AddAsync(ListingSnapshot snapshot, CancellationToken ct=default);
    Task<ListingSnapshot?> GetByReservationIdAsync(Guid reservationId, CancellationToken ct=default);
}

