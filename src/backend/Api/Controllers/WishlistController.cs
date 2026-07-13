using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Components.Forms.Mapping;
using Microsoft.AspNetCore.Mvc;
using Modules.Listings;
using Modules.Listings.Models.Dto;
using Modules.SharedKernel;
using Modules.Wishlist;

namespace Api.Controllers;

[ApiController]
[Route("api/wishlist")]
[Authorize]
public class WishlistController : ControllerBase
{
    private readonly IWishlistService _wishlist;

    public WishlistController(IWishlistService wishlist)
    {
        _wishlist = wishlist;
    }

    private Guid CallerId => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    // POST /api/wishlist
    [HttpPost]
    public async Task<IActionResult> Add([FromBody] AddToWishlistRequest request, CancellationToken ct)
    {
        try
        {
            var item = await _wishlist.AddAsync(CallerId, request.ListingId, ct);
            return Ok(item);
        }
        catch (WishlistException ex)
        {
            return MapError(ex);
        }
    }

    // GET /api/wishlist
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var items = await _wishlist.ListAsync(CallerId, ct);

        return Ok(new { items, total = items.Count });
    }

    // DELETE /api/wishlist/{listingId}
    [HttpDelete("{listingId:guid}")]
    public async Task<IActionResult> Remove(Guid listingId, CancellationToken ct)
    {
        var removed = await _wishlist.RemoveAsync(CallerId, listingId, ct);
        return removed ? NoContent() : NotFound(new { error = WishlistErrors.NotFound });
    }

    private IActionResult MapError(WishlistException ex) => ex.Message switch
    {
        WishlistErrors.ListingNotFound => NotFound(new { error = ex.Message }),
        WishlistErrors.NotFound => NotFound(new { error = ex.Message }),
        WishlistErrors.AlreadyWishlisted => Conflict(new { error = ex.Message }),
        WishlistErrors.ListingUnavailable => Conflict(new { error = ex.Message }),
        _ => StatusCode(500, new { error = "server_error" }),
    };

    public record AddToWishlistRequest(Guid ListingId);
}
