using Modules.Transactions.Models.Dto;

namespace Modules.Transactions;

public interface ITransactionsService
{
    Task<TransactionRequestDto> CreatesTransactionReq(
        Guid reservationId,
        Guid buyerId,
        CancellationToken ct = default
    );

    Task ConfirmTransactionAsync(
        Guid reservationId,
        string payfastTransactionId,
        CancellationToken ct = default
    );
    Task VerifyPinAsync(
        Guid reservationId,
        Guid buyerId,
        string pin,
        CancellationToken ct = default
    );
    bool VerifySignature(string rawBody, string receivedSign);
    Task<string> GetPendingPinAsync(
        Guid reservationId,
        Guid sellerId,
        CancellationToken ct = default
    );
}
