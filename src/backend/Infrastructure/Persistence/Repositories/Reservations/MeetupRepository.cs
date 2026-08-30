using Microsoft.EntityFrameworkCore;
using Modules.Reservations.Models;
using Modules.Reservations.Repositories;
using Modules.Reservations.StateMachine;
using Modules.SharedKernel;

namespace Infrastructure.Persistence.Repositories.Reservations;

public class MeetupRepository : IMeetupRepository
{
    private readonly AppDbContext _db;

    public MeetupRepository(AppDbContext db) => _db = db;

    public async Task AddAsync(Meetup meetup, CancellationToken ct = default)
    {
        await _db.Meetups.AddAsync(meetup, ct);
    }

    public Task<Meetup?> GetByIdAsync(int meetupId, CancellationToken ct = default) =>
        _db.Meetups.FirstOrDefaultAsync(m => m.MeetupId == meetupId, ct);

    public Task<Meetup?> GetActiveByReservationAsync(
        Guid reservationId,
        CancellationToken ct = default
    ) =>
        _db
            .Meetups.Where(m => m.ReservationId == reservationId && m.Status == "scheduled")
            .OrderByDescending(m => m.AgreedTime)
            .FirstOrDefaultAsync(ct);

    public Task SaveAsync(CancellationToken ct = default) => _db.SaveChangesAsync(ct);

    public async Task<bool> ExistsForReservationAsync(
        Guid reservationId,
        CancellationToken ct = default
    ) =>
        await _db.Meetups.AnyAsync(
            m => m.ReservationId == reservationId && m.Status == "scheduled",
            ct
        );

    public async Task<Meetup?> GetActiveByReservationTrackedAsync(
        Guid reservationId,
        CancellationToken ct = default
    ) =>
        await _db
            .Meetups.Where(m => m.ReservationId == reservationId && m.Status == "scheduled")
            .OrderByDescending(m => m.AgreedTime)
            .FirstOrDefaultAsync(ct);

    public async Task<IReadOnlyList<Meetup>> GetDueForNoShowDetectionAsync(DateTime asOf,int batchSize, CancellationToken ct =default)
    {
        return await _db.Meetups
            .Where(m=> m.Status == "scheduled" && m.CheckinWindowClosesAt <= asOf)
            .Take(batchSize)
            .ToListAsync(ct);
    }

}
