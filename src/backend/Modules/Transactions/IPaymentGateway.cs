using Modules.Transactions.Models.Dto;
namespace Modules.Transactions;

public interface IPaymentGateway
{
    TransactionRequestDto CreatePaymentRequest(
        Guid reservationId,
        string listingTitle,
        decimal amount,
        string buyerFirstName,
        string buyerEmail
    );
    bool VerifySignature(string rawBody, string receivedSign);
}
