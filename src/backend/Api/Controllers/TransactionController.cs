using System.Security.Claims;
using System.Text;
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
    private readonly ITransactionsService _transactionsService;
    private readonly IReservationRepository _reservations;
    private readonly ITransactionRepository _transactions;

    public TransactionController(
        ITransactionsService Transactions,
        IReservationRepository reservations,
        ITransactionRepository transactions
    )
    {
        _transactionsService = Transactions;
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
            var result = await _transactionsService.CreatesTransactionReq(reservationId, buyerId, ct);
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
        Request.Body.Position = 0;
        string rawBody;
        using (var ms = new MemoryStream())
        {
            await Request.Body.CopyToAsync(ms, ct);
            ms.Position = 0;
            using var reader = new StreamReader(ms, Encoding.UTF8);
            rawBody = await reader.ReadToEndAsync(ct);
        }

        var fields = rawBody
            .Split('&', StringSplitOptions.RemoveEmptyEntries)
            .Select(pair => pair.Split('=', 2))
            .ToDictionary(
                parts => Uri.UnescapeDataString(parts[0]),
                parts => parts.Length > 1 ? Uri.UnescapeDataString(parts[1].Replace('+', ' ')) : ""
            );

        if (!fields.TryGetValue("signature", out var receivedSign))
        {
            return BadRequest();
        }

        if (!_transactionsService.VerifySignature(rawBody, receivedSign))
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
            await _transactionsService.ConfirmTransactionAsync(reservationId, pfTransactionId, ct);
        }

        return Ok();
    }

    //Added the following endpoints for integration (Tafadzwa)

    [HttpPost("{reservationId}/verify-pin")]
    [Authorize]
    public async Task<IActionResult> VerifyPin(
        Guid reservationId,
        [FromBody] VerifyPinRequest request,
        CancellationToken ct
    )
    {
        var userIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out var buyerId))
        {
            return Unauthorized();
        }

        try
        {
            await _transactionsService.VerifyPinAsync(reservationId, buyerId, request.Pin, ct);
            return Ok();
        }
        catch (TransactionException ex)
        {
            return ex.Code switch
            {
                "transaction_not_found" => NotFound(new { code = ex.Code }),
                "not_buyer" => Forbid(),
                "too_many_attempts" => BadRequest(new { code = ex.Code }),
                "invalid_pin" => BadRequest(new { code = ex.Code }),
                _ => BadRequest(new { code = ex.Code }),
            };
        }
    }

    [HttpGet("{reservationId}/transaction-status")]
    [Authorize]
    public async Task<IActionResult> GetTransactionStatus(Guid reservationId, CancellationToken ct)
    {
        var userIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var tx = await _transactions.GetByReservationIdTrackedAsync(reservationId, ct);
        if (tx is null)
        {
            return Ok(
                new
                {
                    transactionStatus = "none",
                    pinStatus = (string?)null,
                    pin = (string?)null,
                }
            );
        }

        if (tx.BuyerId != userId && tx.SellerId != userId)
        {
            return Forbid();
        }

        var pin = (tx.SellerId == userId && tx.TransactionStatus == "completed") ? tx.Pin : null;

        return Ok(
            new
            {
                transactionId = tx.TransactionId,
                transactionStatus = tx.TransactionStatus,
                pinStatus = tx.PinStatus,

                pin,
            }
        );
    }

    [HttpGet("{reservationId}/pending-pin")]
    [Authorize]
    public async Task<IActionResult> GetPendingPin(Guid reservationId, CancellationToken ct)
    {
        var userIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out var sellerId))
        {
            return Unauthorized();
        }

        try
        {
            var pin = await _transactionsService.GetPendingPinAsync(reservationId, sellerId, ct);
            return Ok(new { pin });
        }
        catch (TransactionException ex)
        {
            return ex.Code switch
            {
                TransactionErrors.ReservationNotFound => NotFound(new { code = ex.Code }),
                "not_seller" => Forbid(),
                "transaction_not_found" => NotFound(new { code = ex.Code }),
                "pin_not_pending" => BadRequest(new { code = ex.Code }),
                _ => BadRequest(new { code = ex.Code }),
            };
        }
    }

    public record VerifyPinRequest(string Pin);
}
