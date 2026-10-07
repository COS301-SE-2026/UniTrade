using System.Globalization;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Modules.Reservations;
using Modules.Reservations.Availability;

namespace Api.Controllers;

[ApiController]
[Route("api/meetups")]
[Authorize]
public class AvailabilityController : ControllerBase
{
    private readonly IAvailabilityService _availability;

    public AvailabilityController(IAvailabilityService availability)
    {
        _availability = availability;
    }

    private Guid CallerId
    {
        get
        {
            var value =
                User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (value is null || !Guid.TryParse(value, out var id))
            {
                throw new InvalidOperationException(
                    "Authenticated request is missing a valid user id."
                );
            }
            return id;
        }
    }

    // GET /api/meetups/availability?reservationId
    [HttpGet("availability")]
    public async Task<IActionResult> GetAvailability(
        [FromQuery] Guid reservationId,
        CancellationToken ct
    )
    {
        try
        {
            var result = await _availability.GetAvailabilityAsync(reservationId, CallerId, ct);
            return Ok(Map(result));
        }
        catch (ReservationException ex)
        {
            return MapError(ex);
        }
    }

    private static AvailabilityResponseDto Map(AvailabilityResult result) =>
        result switch
        {
            AvailabilityResult.Ok ok => new AvailabilityResponseDto(
                "ok",
                ok.Slots.Select(ToDto).ToList()
            ),
            AvailabilityResult.NoOverlap => new AvailabilityResponseDto(
                "no_overlap",
                Array.Empty<AvailabilitySlotDto>()
            ),
            AvailabilityResult.MissingTimetable m => new AvailabilityResponseDto(
                "missing_timetable",
                Array.Empty<AvailabilitySlotDto>(),
                m.Party
            ),
            _ => throw new InvalidOperationException(
                $"Unknown availability result: {result.GetType().Name}"
            ),
        };

    private static AvailabilitySlotDto ToDto(AvailabilityWindow slot) =>
        new(
            slot.Date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            (int)slot.Date.DayOfWeek,
            slot.Start.ToString("HH:mm", CultureInfo.InvariantCulture),
            slot.End.ToString("HH:mm", CultureInfo.InvariantCulture)
        );

    private ObjectResult MapError(ReservationException ex) =>
        ex.Message switch
        {
            ReservationErrors.ReservationNotFound => NotFound(new { error = ex.Message }),
            _ => StatusCode(500, new { error = "server_error" }),
        };
}
