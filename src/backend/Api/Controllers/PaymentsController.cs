using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Modules.Payments;
using Modules.Payments.Repositories;
using Modules.Reservations.Repositories;
using Modules.Reservations.StateMachine;

namespace Api.Controllers;

[ApiController]
[Route("api/reservations")]

public class PaymentController:ControllerBase
{
    private readonly IPaymentsService _payments;
    private readonly IReservationRepository _reservations;
    private readonly ITransactionRepository _transactions;

    public PaymentController(IPaymentsService payments,IReservationRepository reservations,ITransactionRepository transactions)
    {
        _payments=payments;
        _reservations=reservations;
        _transactions=transactions;
    }

    [HttpPost("{reservationId}/payment-request")]
    [Authorize]
    public async Task<IActionResult> CreatePaymentRequest(Guid reservationId,CancellationToken ct)
    {
        var userIdClaim=User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;//linked to jwt setup

        if(userIdClaim is null || !Guid.TryParse(userIdClaim,out var buyerId))
        {
            return Unauthorized();
        }

        try{
            var result =await _payments.CreatesPaymentReq(reservationId,buyerId,ct);
             return Ok(new{ sandbox_url=result.ProcessUrl,fields=result.Fields});
        }
        catch(PaymentException ex)
        {
            return  ex.Code switch
            {
                PaymentErrors.ReservationNotFound=>NotFound(new{code=ex.Code}),
                PaymentErrors.NotBuyer=>Forbid(),
                PaymentErrors.InvalidStatus=>BadRequest(new {code=ex.Code}),
                _=>BadRequest(new{code=ex.Code}),            
            };
        }
    }

    [HttpPost("itn")]
    public async Task<IActionResult>HandleItn(CancellationToken ct)
    {
        var form=await Request.ReadFormAsync(ct);
        var fields=form.ToDictionary(f=>f.Key,f=>f.Value.ToString());

        if(!fields.TryGetValue("signature",out var receivedSign))
        {
            return BadRequest();
        }

        if(!_payments.VerifySignature(fields,receivedSign))
        {
            return BadRequest("invalid_signature");
        }

        if(!fields.TryGetValue("m_payment_id",out var paymentIdStr) || !Guid.TryParse(paymentIdStr,out var reservationId))
        {
            return BadRequest("invalid_payment_id");
        }

        var reservation=await _reservations.GetByIdTrackedAsync(reservationId,ct);

        if(reservation is null)
        {
            return NotFound();
        }

        if(reservation.ReservationStatus!=ReservationState.Active)
        {
            return Ok();
        }

        if(fields.GetValueOrDefault("payment_status")=="complete")
        {
            var pfPaymentId=fields.GetValueOrDefault("pf_payment_id") ?? "";
            await _payments.ConfirmPaymentAsync(reservationId,pfPaymentId,ct);
        }

        return Ok();
    }
}