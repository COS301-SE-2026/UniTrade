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

    public SavedSearchesController(ISavedSearchService service)=> service=service;
    private Guid CallerId => Guid.Parse(User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSavedSearchDto dto, CancellationToken ct)
    {
        if(CallerId==null)return Unauthorized();

        var result=await _service.CreateAsync(CallerId.Value, dto, ct);

        return CreateAtAction(nameof(GetMine), new {id=result.SearchId}, result);
    }

    [HttpGet]
    public async Task<IActionResult> GetMine(CancellationToken ct)
    {
        if(CallerId==null) return Unauthorized();
        return Ok(await _service.GetByBuyerAsync(CallerId.Value,ct));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        if(CallerId==null) return Unauthorized();
        await _service.DeleteAsync(id,CallerId.Value,ct);
        return NoContent();
    }
}