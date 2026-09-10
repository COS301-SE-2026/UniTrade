using Modules.Reservations.Models;

namespace Modules.Reservations.Repositories;

public interface IMeetupRepository
{
    Task<Meetup?> GetByIdAsync(int meetupId, CancellationToken ct = default);
    Task<Meetup?> GetActiveByReservationAsync(Guid reservationId, CancellationToken ct = default);

    Task<bool> ExistsForReservationAsync(Guid reservationId, CancellationToken ct = default);

    Task AddAsync(Meetup meetup, CancellationToken ct = default);
    Task SaveAsync(CancellationToken ct = default);

    Task<Meetup?> GetActiveByReservationTrackedAsync(
        Guid reservationId,
        CancellationToken ct = default
    );

    Task<IReadOnlyList<Meetup>> GetDueForNoShowDetectionAsync(DateTime asOf, int batchSize, CancellationToken ct = default);
}
