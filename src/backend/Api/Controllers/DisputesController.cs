using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Modules.Disputes;
using Modules.Disputes.Models.Dto;
using Modules.Listings.Models;
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

    private Guid CallerId
    {
        get
        {
            var value = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (value is null || !Guid.TryParse(value, out var id))
            {
                throw new InvalidOperationException("Authenticated request is missing a valid user id.");
            }
            return id;
        }
    }
    //POST /api/disputes
    //file any dispute type -> no show , report listing,and listing quality
    [HttpPost]
    public async Task<IActionResult> File([FromBody] FileDisputeDto req, CancellationToken ct)
    {
        try
        {
            var result = await _disputes.FileDisputeAsync(req, CallerId, ct);
            return Created($"/api/disputes/{result.CaseId}", result);
        }
        catch (DisputesException ex) when (ex.Message == "forbidden")
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = ex.Message });
        }
        catch (DisputesException ex)
            when (ex.Message
                is "reservation_id_required"
                    or "listing_id_required"
                    or "listing_id_required_for_bundle"
                    or "meetup_id_required"
                    or "report_reason_required"
                    or "photos_required"
                    or "invalid_dispute_type"
            )
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (DisputesException ex)
            when (ex.Message is "snapshot_not_found" or "meetup_not_found" or "listing_not_found" or "listing_not_in_reservation")
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

    [HttpGet("mine")]
    public async Task<IActionResult> GetMine(
[FromServices] IDisputeService disputeService,
[FromQuery] string? type,
CancellationToken ct
    )
    {
        var cases= await disputeService.ListForUserAsync(CallerId,type,ct);
        var withRole = cases.Select(c => new
        {
            c.CaseId,
            c.Type,
            c.Status,
            c.SubjectUserId,
            c.SubmittedAt,
            c.AgeHours,
            c.SlaHours,
            c.SlaBreached,
            c.Title,
            c.SubjectInitials,
            c.CounterpartyInitials,c.RaisedBy,c.SellerId,c.BuyerId,
            c.ReservationId,
            c.ListingId,
            c.ImageUrl,
            c.CopyCount,
            ViewerRole = c.RaisedBy ==CallerId ?  "filed_by_me" :  "againt_me",
        });

        return Ok(new {cases = withRole});

    }

    [HttpGet("mine/{id}")]
    public async Task<IActionResult> GetMineById(
        Guid id,
        [FromServices] IAdminCaseService adminCaseService,
        CancellationToken ct
    )
    {
        try
        {

            var detail = await adminCaseService.GetCaseByIdForUserAsync(id, CallerId,ct);
            if(detail is null)
            {
                return NotFound(new{ error="case_not_found"});
            }
        var viewRole = detail.FiledByUserId == CallerId ? "filed_by_me" : "against_me";
        return Ok(new {detail,viewRole });

        }
        catch (DisputesException ex) when (ex.Message=="forbidden")
        {
            return StatusCode(StatusCodes.Status403Forbidden, new{error = ex.Message });
        }}
}
