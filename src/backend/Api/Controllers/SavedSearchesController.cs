using System;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Modules.SavedSearches;
using Modules.SavedSearches.Models.Dto;

namespace Api.Controllers;

[ApiController]
[Route("api/saved-searches")]
[Authorize]
public class SavedSearchesController : ControllerBase
{
    private readonly ISavedSearchService _service;

    public SavedSearchesController(ISavedSearchService service) => _service = service;
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

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSavedSearchDto dto, CancellationToken ct)
    {
        if (CallerId == null) return Unauthorized();

        var result = await _service.CreateAsync(CallerId, dto, ct);

        return CreatedAtAction(nameof(GetMine), new { id = result.SearchId }, result);
    }

    [HttpGet]
    public async Task<IActionResult> GetMine(CancellationToken ct)
    {
        if (CallerId == null) return Unauthorized();
        return Ok(await _service.GetByBuyerAsync(CallerId, ct));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        if (CallerId == null) return Unauthorized();
        await _service.DeleteAsync(id, CallerId, ct);
        return NoContent();
    }

    [HttpGet("{id:guid}/listings")]
    public async Task<IActionResult> GetMatchingListings(Guid searchId, CancellationToken ct)
    {
        if (CallerId == null)
        {
            return Unauthorized();
        }

        try
        {
            var listings = await _service.GetMatchingListingAsync(searchId, CallerId, ct);
            return Ok(listings);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }
}
