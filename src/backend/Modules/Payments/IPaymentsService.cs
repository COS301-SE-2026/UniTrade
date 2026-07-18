using Modules.Payments.Models.Dto;

namespace Modules.Payments;

public interface IPaymentsService
{
    Task<PaymentRequestDto> CreatesPaymentReq(
        Guid reservationId,
        Guid buyerId,
        CancellationToken ct = default
    );
}
