using Microsoft.EntityFrameworkCore;
using Modules.Reservations.Models;
using Modules.Reservations.Repositories;

namespace Infrastructure.Persistence.Repositories.Reservations;

public class ReservationRepository : IReservationRepository
{
    private readonly AppDbContext _db;

    public ReservationRepository(AppDbContext db) => _db = db;

    public Task<Reservation?> GetByIdAsync(Guid reservationId, CancellationToken ct = default) =>
        _db
            .Reservations.AsNoTracking()
            .Include(r => r.ReservationListings)
            .FirstOrDefaultAsync(r => r.ReservationId == reservationId, ct);

    public Task<Reservation?> GetByIdTrackedAsync(
        Guid reservationId,
        CancellationToken ct = default
    ) =>
        _db
            .Reservations.Include(r => r.ReservationListings)
            .FirstOrDefaultAsync(r => r.ReservationId == reservationId, ct);

    public async Task<IReadOnlyList<Reservation>> ListForBuyerAsync(
        Guid buyerId,
        CancellationToken ct = default
    ) =>
        await _db
            .Reservations.AsNoTracking()
            .Include(r => r.ReservationListings)
            .Where(r => r.BuyerId == buyerId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<Reservation>> ListForSellerAsync(
        Guid sellerId,
        CancellationToken ct = default
    ) =>
        await _db
            .Reservations.AsNoTracking()
            .Include(r => r.ReservationListings)
            .Where(r => r.SellerId == sellerId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(ct);

    public Task<bool> IsPartyToAsync(
        Guid reservationId,
        Guid userId,
        CancellationToken ct = default
    ) =>
        _db.Reservations.AnyAsync(
            r => r.ReservationId == reservationId && (r.BuyerId == userId || r.SellerId == userId),
            ct
        );

    public async Task AddAsync(Reservation reservation, CancellationToken ct = default)
    {
        await _db.Reservations.AddAsync(reservation, ct);
    }

    public Task SaveAsync(CancellationToken ct = default) => _db.SaveChangesAsync(ct);
}
