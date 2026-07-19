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
        Guid sellerId,
        string pin,
        CancellationToken ct = default
    );
    bool VerifySignature(Dictionary<string, string> itnFields, string receivedSign);
}
