using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Modules.Notifications;
using Modules.Notifications.Repositories;
using Modules.Reservations;
using Modules.Reservations.Models.Dto;

namespace Api.Controllers;

[ApiController]
[Route("api/device-tokens")]
[Authorize]
public class DeviceTokensController(IFcmPushService fcm) : ControllerBase
{
    private readonly IFcmPushService _fcm = fcm;

    private Guid CallerId => Guid.Parse(User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

    [HttpPost]
    public async Task<IActionResult> Register(
        [FromBody] RegisterTokenRequest body,
        CancellationToken ct = default
    )
    {
        if (string.IsNullOrWhiteSpace(body.Token))
        {
            return BadRequest(new { error = "token_required" });
        }
        if (body.Platform is not ("web" or "ios" or "android"))
        {
            return BadRequest(new { error = "invalid_platform" });
        }

        Guid userId;
        try
        {
            userId = CallerId;
        }
        catch
        {
            return Unauthorized(new { error = "invalid_user_claim" });
        }
        await _fcm.RegisterTokenAsync(userId, body.Token, body.Platform, ct);
        return Ok(new { message = "Token registered" });
    }

    public record RegisterTokenRequest(string Token, string Platform);
}
