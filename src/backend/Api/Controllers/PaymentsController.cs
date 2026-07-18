using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Modules.Reservations.Repositories;
using Modules.Reservations.StateMachine;
using Modules.Transactions;
using Modules.Transactions.Repositories;

namespace Api.Controllers;

[ApiController]
[Route("api/reservations")]
public class TransactionController : ControllerBase
{
    private readonly ITransactionsService _Transactions;
    private readonly IReservationRepository _reservations;
    private readonly ITransactionRepository _transactions;

    public TransactionController(
        ITransactionsService Transactions,
        IReservationRepository reservations,
        ITransactionRepository transactions
    )
    {
        _Transactions = Transactions;
        _reservations = reservations;
        _transactions = transactions;
    }

    [HttpPost("{reservationId}/Transaction-request")]
    [Authorize]
    public async Task<IActionResult> CreateTransactionRequest(
        Guid reservationId,
        CancellationToken ct
    )
    {
        var userIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value; //linked to jwt setup

        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out var buyerId))
        {
            return Unauthorized();
        }

        try
        {
            var result = await _Transactions.CreatesTransactionReq(reservationId, buyerId, ct);
            return Ok(new { sandbox_url = result.ProcessUrl, fields = result.Fields });
        }
        catch (TransactionException ex)
        {
            return ex.Code switch
            {
                TransactionErrors.ReservationNotFound => NotFound(new { code = ex.Code }),
                TransactionErrors.NotBuyer => Forbid(),
                TransactionErrors.InvalidStatus => BadRequest(new { code = ex.Code }),
                _ => BadRequest(new { code = ex.Code }),
            };
        }
    }

    [HttpPost("itn")]
    public async Task<IActionResult> HandleItn(CancellationToken ct)
    {
        var form = await Request.ReadFormAsync(ct);
        var fields = form.ToDictionary(f => f.Key, f => f.Value.ToString());

        if (!fields.TryGetValue("signature", out var receivedSign))
        {
            return BadRequest();
        }

        if (!_Transactions.VerifySignature(fields, receivedSign))
        {
            return BadRequest("invalid_signature");
        }

        if (
            !fields.TryGetValue("m_payment_id", out var TransactionIdStr)
            || !Guid.TryParse(TransactionIdStr, out var reservationId)
        )
        {
            return BadRequest("invalid_payment_id");
        }

        var reservation = await _reservations.GetByIdTrackedAsync(reservationId, ct);

        if (reservation is null)
        {
            return NotFound();
        }

        if (reservation.ReservationStatus != ReservationState.Active)
        {
            return Ok();
        }

        if (fields.GetValueOrDefault("payment_status") == "COMPLETE")
        {
            var pfTransactionId = fields.GetValueOrDefault("pf_payment_id") ?? "";
            await _Transactions.ConfirmTransactionAsync(reservationId, pfTransactionId, ct);
        }

        return Ok();
    }
}
