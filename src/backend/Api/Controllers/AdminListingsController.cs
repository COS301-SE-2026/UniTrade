using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Modules.Listings.Admin;
using Modules.Listings.Models.Dto;

namespace Api.Controllers;

[Route("api/admin/listings")]
public sealed class AdminListingsController : AdminControllerBase
{
    private readonly IAdminListingRiskService _risk;

    public AdminListingsController(IAdminListingRiskService risk)
    {
        _risk = risk;
    }

    [HttpGet("flagged")]
    public async Task<IActionResult> GetFlagged(
        [FromQuery] string status = "under_review",
        CancellationToken ct = default
    )
    {
        var flagged = await _risk.GetFlaggedAsync(status, ct);
        return Ok(flagged);
    }

    [HttpPost("{id:guid}/decision")]
    public async Task<IActionResult> Decide(
        Guid id,
        [FromBody] AdminListingDecisionRequestDto request,
        CancellationToken ct
    )
    {
        try
        {
            var result = await _risk.DecideAsync(
                id,
                request.Action,
                request.Reason,
                GetAdminId(),
                ct
            );
            return result is null ? NotFound(new { error = "listing_not_found" }) : Ok(result);
        }
        catch (ArgumentException ex) when (ex.Message == "invalid_action")
        {
            return BadRequest(new { error = "invalid_action" });
        }
        catch (ArgumentException ex) when (ex.Message == "reason_required")
        {
            return BadRequest(new { error = "reason_required" });
        }
    }

    private Guid GetAdminId()
    {
        var sub = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(sub, out var id) ? id : Guid.Empty;
    }

    [HttpGet("{id:guid}/flagged")]
    public async Task<IActionResult> GetFlaggedDetail(Guid id, CancellationToken ct)
    {
        var detail = await _risk.GetFlaggedDetailAsync(id, ct);
        return detail is null ? NotFound(new { error = "listing_not_found" }) : Ok(detail);
    }
}
