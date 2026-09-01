using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Modules.Disputes;
using Modules.Disputes.Models.Dto;

namespace Api.Controllers;

[ApiController]
[Route("api/disputes")]
[Authorize]

public class DisputesController : ControllerBase
{
    private readonly IDisputeService _disputes;

    public DisputesController(IDisputeService disputes)
    {
        _disputes = disputes;
    }

    private Guid CallerId => Guid.Parse(User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

    //POST /api/disputes
    //file any dispute type -> no show , report listing,and listing quality
    [HttpPost]
    public async Task<IActionResult> File([FromBody] FileDisputeDto req, CancellationToken ct)
    {
        try
        {
            var result = await _disputes.FileDisputeAsync(req, CallerId, ct);
            return CreatedAtAction(nameof(File), new { caseId = result.CaseId }, result);
        }
        catch (DisputesException ex) when (ex.Message == "forbidden")
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = ex.Message });
        }
        catch (DisputesException ex)
            when (ex.Message
                is "reservation_id_required"
                    or "listing_id_required"
                    or "meetup_id_required"
                    or "report_reason_required"
                    or "photos_required"
                    or "invalid_dispute_type"
            )
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (DisputesException ex)
            when (ex.Message is "snapshot_not_found" or "meetup_not_found" or "listing_not_found")
        {
            return NotFound(new { error = ex.Message });
        }
        catch (DisputesException ex) when (ex.Message is "dispute_already_open" or "listing_not_live")
        {
            return Conflict(new { error = ex.Message });
        }
        catch (DisputesException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
