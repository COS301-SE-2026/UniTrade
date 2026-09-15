using System.Security.Claims;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Modules.Timetable;
using Modules.Timetable.Models.Dto;

namespace Api.Controllers;

[ApiController]
[Route("api/timetable")]
[Authorize]
public class TimetableController : ControllerBase
{
    private readonly ITimetableService _timetable;

    public TimetableController(ITimetableService Timetable)
    {
        _timetable = Timetable;
    }

    private bool TryGetCallerId(out Guid callerId)
    {
        var callerIdClaim =
            User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(callerIdClaim, out callerId);
    }

    // GET /api/Timetable
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        if (!TryGetCallerId(out var callerId))
        {
            return Unauthorized(new { error = "unauthenticated" });
        }
        return Ok(await _timetable.ListMineAsync(callerId, ct));
    }

    // POST /api/Timetable
    [HttpPost]
    public async Task<IActionResult> Add(
        [FromBody] CreateTimetableEntryDto dto,
        CancellationToken ct
    )
    {
        if (!TryGetCallerId(out var callerId))
        {
            return Unauthorized(new { error = "unauthenticated" });
        }

        try
        {
            var created = await _timetable.AddAsync(callerId, dto, ct);
            return Created($"/api/timetable/{created.EntryId}", created);
        }
        catch (TimetableException ex)
        {
            return MapError(ex);
        }
    }

    // DELETE /api/Timetable/{entryId}
    [HttpDelete("{entryId:guid}")]
    public async Task<IActionResult> Remove(Guid entryId, CancellationToken ct)
    {
        if (!TryGetCallerId(out var callerId))
        {
            return Unauthorized(new { error = "unauthenticated" });
        }
        try
        {
            await _timetable.DeleteAsync(callerId, entryId, ct);
            return NoContent();
        }
        catch (TimetableException ex)
        {
            return MapError(ex);
        }
    }

    private ObjectResult MapError(TimetableException ex) =>
        ex.Message switch
        {
            TimetableErrors.InvalidTimeRange => BadRequest(new { error = ex.Message }),
            TimetableErrors.EntryNotFound => NotFound(new { error = ex.Message }),
            TimetableErrors.OverlappingEntry => Conflict(new { error = ex.Message }),
            _ => StatusCode(500, new { error = "server_error" }),
        };
}
