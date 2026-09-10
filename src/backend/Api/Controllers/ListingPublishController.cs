using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Modules.Identity.Verification;
using Modules.Listings;

namespace Api.Controllers;

[ApiController]
[Route("api/listings")]
public sealed class ListingPublishController : ControllerBase
{
    private readonly IListingService _listings;
    private readonly ISellerVerificationQuery _verification;

    public ListingPublishController(IListingService listings, ISellerVerificationQuery verification)
    {
        _listings = listings;
        _verification = verification;
    }

    [Authorize]
    [HttpPost("{id:guid}/publish")]
    public async Task<IActionResult> Publish(Guid id, CancellationToken ct)
    {
        var callerId = GetUserId();
        if (callerId is null)
        {
            return Unauthorized();
        }

        if (!await _verification.IsVerifiedAsync(callerId.Value, ct))
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new { error = "SELLER_NOT_VERIFIED" }
            );
        }

        try
        {
            var ok = await _listings.UpdateStatusAsync(id, callerId.Value, "live", ct);
            return ok ? Ok(new { description = "Published" }) : NotFound();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    private Guid? GetUserId()
    {
        var subVal = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(subVal, out var id) ? id : null;
    }
}
