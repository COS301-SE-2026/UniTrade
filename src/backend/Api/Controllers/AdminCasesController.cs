using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Modules.Disputes;
using Modules.Disputes.Models.Dto;
using Modules.Identity.Verification;
using Modules.SharedKernel;

namespace Api.Controllers;

[Route("api/admin/cases")]
public sealed class AdminCasesController : AdminControllerBase
{
    private readonly IAdminCaseService _adminCaseService;
    private readonly IProofOfRegistrationStorageService _porStorage;

    public AdminCasesController(IAdminCaseService caseService, IProofOfRegistrationStorageService porStorage)
    {
        _adminCaseService = caseService;
        _porStorage = porStorage;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CaseSummaryDto>>> List(
        [FromQuery] string? type,
        [FromQuery] string? status,
        CancellationToken ct
    )
    {
        var fetchedCases = await _adminCaseService.ListCasesAsync(type, status, ct);
        return Ok(fetchedCases);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CaseDetailDto>> Get(Guid id, CancellationToken ct)
    {
        var detail = await _adminCaseService.GetCaseByIdAsync(id, ct);
        return detail is null ? NotFound() : Ok(detail);
    }

    [HttpGet("{id:guid}/document")]
    public async Task<IActionResult> GetDocument(Guid id, CancellationToken ct)
    {
        var result = await _porStorage.GetAsync(id, ct);
        if (result is null)
        {
            return NotFound();
        }

        var (data, contentType, fileName) = result.Value;
        return File(data, contentType, fileName);
    }

    [HttpPost("{id:guid}/decision")]
    public async Task<ActionResult<CaseDetailDto>> Decide(
        Guid id,
        [FromBody] DecisionRequestDto requestDto,
        CancellationToken ct
    )
    {
        var adminId = GetAdminIdentifier();
        if (adminId is null)
        {
            return Unauthorized();
        }

        try
        {
            var updatedCase = await _adminCaseService.DecideCaseAsync(
                id,
                requestDto,
                adminId.Value,
                ct
            );
            return updatedCase is null ? NotFound() : Ok(updatedCase);
        }
        catch (DisputesException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (VerificationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{id:guid}/notes")]
    public async Task<ActionResult<IEnumerable<CaseNoteDto>>> GetNotes(Guid id, CancellationToken ct)
    {
        var notes = await _adminCaseService.GetNotesAsync(id, ct);
        return Ok(notes);
    }

    [HttpPost("{id:guid}/notes")]
    public async Task<ActionResult<CaseNoteDto>> AddNote(Guid id, [FromBody] AddCaseNoteDto dto, CancellationToken ct)
    {
        var adminId = GetAdminIdentifier();
        if (adminId is null)
        {
            return Unauthorized();
        }
        if (string.IsNullOrWhiteSpace(dto.Content))
        {
            return BadRequest(new { error = "content_required" });
        }

        var note = await _adminCaseService.AddNoteAsync(id, adminId.Value, dto.Content.Trim(), ct);
        return Created($"/api/admin/cases/{id}/notes/{note.Id}", note);
    }

    private Guid? GetAdminIdentifier()
    {
        var subVal = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(subVal, out var id) ? id : null;
    }
}
// comment
