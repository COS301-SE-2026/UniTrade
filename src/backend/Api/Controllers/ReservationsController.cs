using System.Security.Claims;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Modules.Chat;
using Modules.Reservations;

namespace Api.Controllers;

[ApiController]
[Route("api/reservations")]
[Authorize]
public class ReservationsController : ControllerBase
{
    private readonly IReservationService _reservations;
    private readonly IChatService _chat;

    public ReservationsController(IReservationService reservations, IChatService chat)
    {
        _reservations = reservations;
        _chat = chat;
    }

    private Guid CallerId => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    private bool IsVerified => User.FindFirst("verification_status")?.Value == "verified";

    // POST /api/reservations
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateReservationRequest body,
        CancellationToken ct
    )
    {
        if (!IsVerified)
            return StatusCode(403, new { error = "not_verified" });

        try
        {
            var dto = await _reservations.CreateAsync(body.ListingId, CallerId, ct);
            return CreatedAtAction(nameof(GetById), new { id = dto.ReservationId }, dto);
        }
        catch (ReservationException ex)
        {
            return MapError(ex);
        }
    }

    // POST /api/reservations/{id}/acknowledge

    [HttpPost("{id:guid}/acknowledge")]
    public async Task<IActionResult> Acknowledge(Guid id, CancellationToken ct)
    {
        try
        {
            return Ok(await _reservations.AcknowledgeAsync(id, CallerId, ct));
        }
        catch (ReservationException ex)
        {
            return MapError(ex);
        }
    }

    // POST /api/reservations/{id}/cancel
    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken ct)
    {
        try
        {
            return Ok(await _reservations.CancelAsync(id, CallerId, ct));
        }
        catch (ReservationException ex)
        {
            return MapError(ex);
        }
    }

    // GET /api/reservations?role=buyer|seller

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string role, CancellationToken ct)
    {
        if (role is not ("buyer" or "seller"))
        {
            return BadRequest(new { error = "invalid_role" });
        }

        var items = await _reservations.ListForUserAsync(CallerId, role, ct);
        return Ok(
            new
            {
                items,
                hasMore = false,
                nextCursor = (string?)null,
            }
        );
    }

    // get /api/reservations/{id}

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var dto = await _reservations.GetByIdAsync(id, CallerId, ct);
        return dto is null ? NotFound(new { error = "not_found" }) : Ok(dto);
    }

    // get /api/reservations/{id}/messages?before={messageId}&limit=20
    [HttpGet("{id:guid}/messages")]
    public async Task<IActionResult> GetMessages(
        Guid id,
        [FromQuery] int? before,
        [FromQuery] int limit,
        CancellationToken ct
    )
    {
        if (limit is <= 0 or > 100)
        {
            limit = 20;
        }
        try
        {
            var chatHistory = await _chat.GetHistoryAsync(id, CallerId, before, limit, ct);
            return Ok(chatHistory);
        }
        catch (ChatException ex) when (ex.Message == "forbidden")
        {
            return StatusCode(403, new { error = "forbidden" });
        }
    }

    private IActionResult MapError(ReservationException ex) =>
        ex.Message switch
        {
            ReservationErrors.ListingNotFound => NotFound(new { error = ex.Message }),
            ReservationErrors.NotFound => NotFound(new { error = ex.Message }),
            ReservationErrors.AlreadyReserved => Conflict(new { error = ex.Message }),
            ReservationErrors.SelfReserve => StatusCode(403, new { error = ex.Message }),
            ReservationErrors.Forbidden => StatusCode(403, new { error = ex.Message }),
            ReservationErrors.NotActive => Conflict(new { error = ex.Message }),
            ReservationErrors.AlreadyAcknowledged => Conflict(new { error = ex.Message }),
            ReservationErrors.AlreadyTerminal => Conflict(new { error = ex.Message }),
            ReservationErrors.ReleasedTooEarly => StatusCode(403, new { error = ex.Message }),
            _ => StatusCode(500, new { error = "server_error" }),
        };

    public record CreateReservationRequest([property: JsonRequired] Guid ListingId);
}
