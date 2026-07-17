using Modules.Payments.Models.dto;

namespace Modules.Payments;

public interface IPaymentsService
{
    Task<PaymentRequestDto> CreatesPaymentReq(
        Guid reservationId,
        Guid buyerId,
        CancellationToken ct = default
    );
}
