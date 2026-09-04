using System.Security.Claims;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Modules.Chat.Models.Dto;
using Modules.Reservations;

namespace Api.Controllers;

[ApiController]
[Route("api/reservations/{reservationId:guid}/meetup")]
[Authorize]
public class MeetupsController(IMeetupService meetups) : ControllerBase
{
    private readonly IMeetupService _meetups = meetups;

    private Guid CallerId => Guid.Parse(User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

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

    // POST /api/reservations/{id}/meetup/accept
    [HttpPost("accept")]
    public async Task<IActionResult> Accept(
        Guid reservationId,
        [FromBody] RespondMeetupRequest body,
        CancellationToken ct = default
    )
    {
        try
        {
            return Ok(
                await _meetups.AcceptAsync(reservationId, CallerId, body.ProposalMessageId, ct)
            );
        }
        catch (ReservationException ex)
        {
            return MapError(ex);
        }
    }

    // POST /api/reservations/{id}/meetup/check-in
    [HttpPost("check-in")]
    public async Task<IActionResult> Accept(
        Guid reservationId,
        [FromBody] CheckInRequest body,
        CancellationToken ct = default
    )
    {
        try
        {
            return Ok(await _meetups.CheckInAsync(reservationId, CallerId, body.Lat, body.Lng, ct));
        }
        catch (ReservationException ex)
        {
            return MapError(ex);
        }
    }

    //GET /api/reservations/{id}/meetup
    [HttpGet]
    public async Task<IActionResult> GetStatus(Guid reservationId, CancellationToken ct = default)
    {
        try
        {
            var status = await _meetups.GetMeetupStatusAsync(reservationId, CallerId, ct);
            return status is null ? NotFound(new { error = "meetup_not_found" }) : Ok(status);
        }
        catch (ReservationException ex)
        {
            return MapError(ex);
        }
    }

    // POST /api/reservations/{id}/meetup/decline
    [HttpPost("decline")]
    public async Task<IActionResult> Decline(
        Guid reservationId,
        [FromBody] RespondMeetupRequest body,
        CancellationToken ct = default
    )
    {
        try
        {
            return Ok(
                await _meetups.DeclineAsync(reservationId, CallerId, body.ProposalMessageId, ct)
            );
        }
        catch (ReservationException ex)
        {
            return MapError(ex);
        }
    }

    // decline proposal, and put for location change, add a edit unconfirmed meeutp, one a meetup is confirmed disacrd he other one
    private ObjectResult MapError(ReservationException ex) =>
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
            ReservationErrors.ProposalNotFound => NotFound(new { error = ex.Message }),
            ReservationErrors.CannotAcceptOwnProposal => StatusCode(
                403,
                new { error = ex.Message }
            ),
            ReservationErrors.NotAProposal => BadRequest(new { error = ex.Message }),
            ReservationErrors.AlreadyResponded => Conflict(new { error = ex.Message }),
            ReservationErrors.MeetupNotFound => NotFound(new { error = ex.Message }),
            ReservationErrors.MeetupNotScheduled => Conflict(new { error = ex.Message }),
            ReservationErrors.AlreadyCheckedIn => Conflict(new { error = ex.Message }),
            ReservationErrors.CheckInWindowClosed => Conflict(new { error = ex.Message }),
            _ => StatusCode(500, new { error = "server_error" }),
        };

    public record ProposeMeetupRequest(
        string LocationName,
        [property: JsonRequired] decimal Lat,
        [property: JsonRequired] decimal Lng,
        [property: JsonRequired] DateTime ProposedTime
    );

    public record RespondMeetupRequest([property: JsonRequired] int ProposalMessageId);

    public record CheckInRequest(decimal? Lat = null, decimal? Lng = null);
}
