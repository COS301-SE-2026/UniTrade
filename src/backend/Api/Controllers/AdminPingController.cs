using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Route("api/admin")]
[ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
public sealed class AdminPingController : AdminControllerBase
{
    [HttpGet("ping")]
    public IActionResult Ping() => Ok(new { ok = true });
}
