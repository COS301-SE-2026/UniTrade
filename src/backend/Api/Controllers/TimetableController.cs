using System.Security.Claims;
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
    private readonly IIcsImportService _icsImport;

    public TimetableController(ITimetableService timetable, IIcsImportService icsImport)
    {
        _timetable = timetable;
        _icsImport = icsImport;
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
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(object), StatusCodes.Status409Conflict)]
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

    // POST /api/Timetable/import/preview
    [HttpPost("import/preview")]
    [RequestSizeLimit(2 * 1024 * 1024 + 4096)]
    [RequestFormLimits(MultipartBodyLengthLimit = 2 * 1024 * 1024)]
    [ProducesResponseType(typeof(ImportPreviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ImportPreview([FromForm] IFormFile file, CancellationToken ct)
    {
        if (!TryGetCallerId(out _))
        {
            return Unauthorized(new { error = "unauthenticated" });
        }

        if (file is null || file.Length == 0)
            return BadRequest(new { error = TimetableErrors.ImportParseFailed });

        try
        {
            await using var stream = file.OpenReadStream();

            var preview = await _icsImport.PreviewAsync(stream, ct);
            return Ok(preview);
        }
        catch (TimetableException ex)
        {
            return MapError(ex);
        }
    }

    // POST /api/Timetable/import/commit
    [HttpPost("import/commit")]
    [ProducesResponseType(typeof(ImportCommitResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ImportCommit(
        [FromBody] IReadOnlyList<ImportPatternDto> patterns,
        CancellationToken ct
    )
    {
        if (!TryGetCallerId(out var callerId))
        {
            return Unauthorized(new { error = "unauthenticated" });
        }

        if (patterns is null || patterns.Count == 0)
        {
            return BadRequest(new { error = TimetableErrors.ImportParseFailed });
        }
        try
        {
            var result = await _icsImport.CommitAsync(callerId, patterns, ct);
            return Ok(result);
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
            TimetableErrors.ImportParseFailed => BadRequest(new { error = ex.Message }),
            _ => StatusCode(500, new { error = "server_error" }),
        };
}
