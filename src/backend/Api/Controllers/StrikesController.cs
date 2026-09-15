using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Modules.Reputation;

namespace Api.Controllers;

[ApiController]
[Authorize]
[Route("api/users/{userId:guid}/strikes")]
public sealed class StrikesController : ControllerBase
{
    private readonly IReputationService _reputation;

    public StrikesController(IReputationService reputation) => _reputation = reputation;

    [HttpGet]
    public async Task<IActionResult> Get(Guid userId, CancellationToken ct)
    {
        var strikes = await _reputation.GetStrikesAsync(userId, ct);
        return Ok(
            strikes.Select(s => new
            {
                s.StrikeId,
                s.Type,
                s.Reason,
                s.SourceCaseId,
                s.CreatedAt,
            })
        );
    }
}
