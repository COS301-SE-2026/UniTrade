using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Modules.Chat;
using Modules.Chat.Models.Dto;
using Modules.Reservations;

namespace Api.Controllers;

[ApiController]
[Route("api/reservations/{reservationId:guid}/meetup")]
[Authorize]
public class MeetupsController(IMeetupService meetups) : ControllerBase
{
    private readonly IMeetupService _meetups = meetups;

    private Guid CallerId => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    private bool IsVerified => User.FindFirst("verification_status")?.Value == "verified";

    // POST /api/reservations/__/meetup
    [HttpPost("propose")]
    public async Task<IActionResult> Propose(
        Guid reservationId,
        [FromBody] ProposeMeetupRequest body,
        CancellationToken ct = default
    )
    {
        try
        {
            var payload = new MeetupProposalPayload(
                body.LocationName,
                body.Lat,
                body.Lng,
                body.ProposedTime
            );
            return Ok(await _meetups.ProposeAsync(reservationId, CallerId, payload, ct));
        }
        catch (ReservationException ex)
        {
            return MapError(ex);
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
            ReservationErrors.TimeInPast => BadRequest(new { error = ex.Message }),
            _ => StatusCode(500, new { error = "server_error" }),
        };

    public record ProposeMeetupRequest(
        string LocationName,
        decimal Lat,
        decimal Lng,
        DateTime ProposedTime
    );
}
