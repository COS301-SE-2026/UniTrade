using Microsoft.EntityFrameworkCore;
using Modules.Reservations.Models;
using Modules.Reservations.Repositories;
using Modules.Reservations.StateMachine;
using Modules.SharedKernel;

namespace Infrastructure.Persistence.Repositories.Reservations;

public class ReservationRepository : IReservationRepository, IReservationMembership
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
            .Reservations.Include(r => r.ReservationListings).ThenInclude(r1=>r1.Listing)//added this so pin verf. will not null ref . PSSSSSS->>>(remove if we get errs during integration on working reservation feature)
            .FirstOrDefaultAsync(r => r.ReservationId == reservationId, ct);

    public async Task<IReadOnlyList<Reservation>> ListForBuyerAsync(
        Guid buyerId,
        CancellationToken ct = default
    ) =>
        await _db
            .Reservations.AsNoTracking()
            .Include(r => r.ReservationListings)
                .ThenInclude(rl => rl.Listing)
                    .ThenInclude(l => l.Images)
            .Include(r => r.Buyer)
            .Include(r => r.Seller)
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
                .ThenInclude(rl => rl.Listing)
                    .ThenInclude(l => l.Images)
            .Include(r => r.Buyer)
            .Include(r => r.Seller)
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

    public async Task<IReadOnlyList<Reservation>> GetDueForExpiryAsync(
        DateTime asOf,
        int batchSize = 100,
        CancellationToken ct = default
    ) =>
        await _db
            .Reservations.Include(r => r.ReservationListings)
            .Where(r => r.ReservationStatus == ReservationState.Active && r.ExpiresAt <= asOf)
            .OrderBy(r => r.ExpiresAt)
            .Take(batchSize)
            .ToListAsync(ct);
}
