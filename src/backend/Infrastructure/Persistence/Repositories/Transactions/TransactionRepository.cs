using Microsoft.EntityFrameworkCore;
using Modules.Transactions.Models;
using Modules.Transactions.Repositories;

namespace Infrastructure.Persistence.Repositories.Transactions;

public class TransactionRepository : ITransactionRepository
{
    private readonly AppDbContext _db;

    public TransactionRepository(AppDbContext db) => _db = db;

    public Task<Transaction?> GetByReservationIdAsync(
        Guid reservationId,
        CancellationToken ct = default
    ) => _db.Transactions.AsNoTracking().FirstOrDefaultAsync(t => t.ReservationId == reservationId);

    public Task<Transaction?> GetByReservationIdTrackedAsync(
        Guid reservationId,
        CancellationToken ct = default
    ) => _db.Transactions.FirstOrDefaultAsync(t => t.ReservationId == reservationId);

    public async Task AddAsync(Transaction transaction, CancellationToken ct = default) =>
        await _db.Transactions.AddAsync(transaction, ct);

    public Task SaveAsync(CancellationToken ct = default) => _db.SaveChangesAsync(ct);

    public Task<Transaction?> GetByIdAsync(Guid transactionId, CancellationToken ct = default) =>
        _db
            .Transactions.AsNoTracking()
            .FirstOrDefaultAsync(t => t.TransactionId == transactionId, ct);
}
