using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Modules.Identity;
using Modules.Identity.Models.Dto;

namespace Api.Controllers;

[ApiController]
[Route("api/users")]
public class UserController(IIdentityService identityService) : ControllerBase
{
    private readonly IIdentityService _identityService = identityService;
    private const string ServerErrorMessage = "server_error";

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMe()
    {
        try
        {
            //'USer' here is built in. .net puts all jwt claims in this Object when client requests
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { error = "unauthenticated" });
            }

            var result = await _identityService.GetMeAsync(userId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return ex.Message switch
            {
                "not_found" => Unauthorized(new { error = "user_not_found" }),
                _ => StatusCode(500, new { error = "server_error" }),
            };
        }
    }

    [HttpPut("profile")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        try
        {
            var UserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(UserId))
            {
                return Unauthorized(new { error = "unauthenticated" });
            }
            var result = await _identityService.UpdateProfileAsync(UserId, dto);
            return Ok(result);
        }
        catch (IdentityException ex)
        {
            return ex.Message switch
            {
                "not_found" => NotFound(new { error = "user_not_found" }),
                "invalid_year_of_study" => UnprocessableEntity(
                    new { error = "invalid_year_of_study" }
                ),
                "degree_program_required" => UnprocessableEntity(
                    new { error = "degree_program_required" }
                ),
                _ => StatusCode(500, new { error = ServerErrorMessage }),
            };
        }
        catch (Exception)
        {
            return StatusCode(500, new { error = ServerErrorMessage });
        }
    }

    [HttpDelete("account")]
    [Authorize]
    public async Task<IActionResult> DeleteAccount()
    {
        try
        {
            var UserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(UserId))
            {
                return Unauthorized(new { error = "unauthenticated" });
            }
            await _identityService.DeleteAccountAsync(UserId);

            Response.Cookies.Delete("authToken", new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Lax,
            });

            return Ok(new { message = "Account deleted successfully" });
        }
        catch (IdentityException ex)
        {
            return ex.Message switch
            {
                "not_found" => NotFound(new { error = "user_not_found" }),
                _ => StatusCode(500, new { error = ServerErrorMessage }),
            };
        }
        catch (Exception)
        {
            return StatusCode(500, new { error = ServerErrorMessage });
        }
    }

}
// random
