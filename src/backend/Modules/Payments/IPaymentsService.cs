using Modules.Payments.Models.Dto;

namespace Modules.Payments;

public interface IPaymentsService
{
    Task<PaymentRequestDto> CreatesPaymentReq(
        Guid reservationId,
        Guid buyerId,
        CancellationToken ct = default
    );

    Task ConfirmPaymentAsync(Guid reservationId,string payfastPaymentId,CancellationToken ct=default);
    Task VerifyPinAsync(Guid reservationId,Guid sellerId,string pin, CancellationToken ct=default);
}
