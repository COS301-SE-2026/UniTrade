using Modules.Reservations.Models;

namespace Modules.Reservations.Repositories;

public interface IReservationRepository
{
    Task<Reservation?> GetByIdAsync(Guid reservationId, CancellationToken ct = default);
    Task<Reservation?> GetByIdTrackedAsync(Guid reservationId, CancellationToken ct = default);

    Task<IReadOnlyList<Reservation>> ListForBuyerAsync(
        Guid buyerId,
        CancellationToken ct = default
    );
    Task<IReadOnlyList<Reservation>> ListForSellerAsync(
        Guid sellerId,
        CancellationToken ct = default
    );
    Task<bool> IsPartyToAsync(Guid reservationId, Guid userId, CancellationToken ct = default);

    Task AddAsync(Reservation reservation, CancellationToken ct = default);
    Task SaveAsync(CancellationToken ct = default);

    Task<IReadOnlyList<Reservation>> GetDueForExpiryAsync(DateTime asOf, int batchSize = 100, CancellationToken ct = default);
}
