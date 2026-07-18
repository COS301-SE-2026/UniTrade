using Modules.Transactions.Models;

namespace Modules.Transactions.Repositories;

public interface ITransactionRepository
{
    Task<Transaction?> GetByReservationIdAsync(Guid reservationId, CancellationToken ct = default);
    Task<Transaction?> GetByReservationIdTrackedAsync(
        Guid reservationId,
        CancellationToken ct = default
    );
    Task AddAsync(Transaction transaction, CancellationToken ct = default);
    Task SaveAsync(CancellationToken ct = default);
    Task<Transaction?> GetByIdAsync(Guid transactionId, CancellationToken ct = default);
}
