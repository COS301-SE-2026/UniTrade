using Microsoft.EntityFrameworkCore;
using Modules.Listings.Models;
using Modules.Listings.Repositories;

namespace Infrastructure.Persistence.Repositories.Listings;

public class ListingSnapshotRepository : IListingSnapshotRepository
{
    private readonly AppDbContext _db;

    public ListingSnapshotRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task AddAsync(ListingSnapshot snapshot, CancellationToken ct = default)
    {
        await _db.ListingSnapshot.AddAsync(snapshot, ct);
    }

    public async Task<IReadOnlyList<ListingSnapshot>> GetByReservationIdAsync(
        Guid reservationId,
        CancellationToken ct = default
    )
    {
        return await _db.ListingSnapshot
            .Where(s => s.ReservationId == reservationId)
            .ToListAsync(ct);
    }

    public async Task<ListingSnapshot?> GetByIdAsync(
        Guid snapshotId,
        CancellationToken ct = default
    )
    {
        return await _db.ListingSnapshot.FirstOrDefaultAsync(s => s.SnapshotId == snapshotId, ct);
    }
}
