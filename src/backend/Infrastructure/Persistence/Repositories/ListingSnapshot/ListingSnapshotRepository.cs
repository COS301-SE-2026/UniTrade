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

    public async Task<ListingSnapshot?> GetByReservationIdAsync(Guid reservationId, CancellationToken ct = default)
    { return await _db.ListingSnapshot.AsNoTracking().FirstOrDefaultAsync(s => s.ReservationId == reservationId, ct); }
}
