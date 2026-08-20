using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Modules.Identity;
using Modules.Identity.Models.DTO;
using Modules.Identity.Models.Dto;
using Modules.Identity.Repositories;
using Modules.Identity.Verification;

namespace Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IIdentityService _identityService;
    private readonly IVerificationService _verificationService;
    private readonly IWebHostEnvironment _env;

    public AuthController(
        IIdentityService identityService,
        IVerificationService verificationService,
        IWebHostEnvironment env
    )
    {
        _identityService = identityService;
        _verificationService = verificationService;
        _env = env;
    }

    [HttpPost("register")]
    [EnableRateLimiting("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (dto.TermsAcceptedAt is null)
        {
            return UnprocessableEntity(new { error = "terms_not_accepted" });
        }
        try
        {
            var user = await _identityService.RegisterAsync(dto);

            await _verificationService.InitiateAsync(user.Email, user.UserId);

            return Ok(new { message = "OTP sent to your email." });
        }
        catch (Exception ex)
        {
            return ex.Message switch
            {
                "invalid_email" => UnprocessableEntity(new { error = "invalid_email" }),
                "invalid_year_of_study" => UnprocessableEntity(
                    new { error = "invalid_year_of_study" }
                ),
                "email_taken" => Conflict(new { error = "email_taken" }),
                "otp_already_sent" => StatusCode(429, new { error = "otp_already_sent" }),
                "invalid_domain" => UnprocessableEntity(new { error = "invalid_domain" }),
                "weak_password" => UnprocessableEntity(new { error = "weak_password" }),
                _ => StatusCode(500, new { error = "server_error" }),
            };
        }
    }

    [HttpPost("verify-otp")]
    [EnableRateLimiting("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto dto)
    {
        var user = await _identityService.GetUserByEmailAsync(dto.Email);

        if (user == null)
            return Unauthorized(new { error = "invalid_otp" });

        await _verificationService.VerifyAsync(user.UserId, dto.Otp);

        return Ok(new { message = "Verified successfully." });
    }

    [HttpPost("resend-otp")]
    [EnableRateLimiting("resend-otp")]
    public async Task<IActionResult> ResendOtp([FromBody] ResendOtpDto dto)
    {
        var user = await _identityService.GetUserByEmailAsync(dto.Email);

        if (user == null)
        {
            // this prevents email enumeration (always return success)
            return Ok(
                new
                {
                    message = "If this email is registered and pending verification, a new OTP has been sent.",
                }
            );
        }
        try
        {
            await _verificationService.ResendAsync(user.UserId, dto.Email);
        }
        catch (Exception ex)
            when (ex.Message
                    is "already_verified"
                        or "resend_limit_exceeded"
                        or "invalid_request"
                        or "cooldown_active"
            )
        {
            // for the purpose of making this truly enumeration-proof, nothing is done
        }

        return Ok(
            new
            {
                message = "If this email is registered and pending verification, a new OTP has been sent.",
            }
        );
    }

    [HttpPost("login")]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto request)
    {
        try
        {
            var token = await _identityService.LoginAsync(request); //business logic layer comes in. It gives us the results

            Response.Cookies.Append(
                "authToken",
                token,
                new CookieOptions
                {
                    HttpOnly = true,
                    Secure = !_env.IsDevelopment(),
                    SameSite = SameSiteMode.Lax,
                    Expires = DateTimeOffset.UtcNow.AddHours(24),
                    Path = "/",
                }
            );

            return Ok(new { message = "Login successful" });
        }
        catch (Exception e)
        {
            return e.Message switch
            {
                "invalid_credentials" => Unauthorized(new { error = "invalid_credentials" }),
                _ => StatusCode(500, new { error = "server_error" }),
            };
        }
    }

    [HttpPost("logout")]
    [ProducesResponseType<object>(StatusCodes.Status200OK)]
    public IActionResult Logout()
    {
        Response.Cookies.Delete(
            "authToken",
            new CookieOptions
            {
                HttpOnly = true,
                Secure = !_env.IsDevelopment(),
                SameSite = SameSiteMode.Lax,
            }
        );
        return Ok(new { message = "Logged out successfully" });
    }

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
                "not_found" => Unauthorized(new { error = "unauthenticatedfailling" }),
                _ => StatusCode(500, new { error = "server_error" }),
            };
        }
    }

    [HttpGet("hub-token")]
    [Authorize]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public IActionResult HubToken()
    {
        var userId =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        return Ok(new { token = _identityService.GenerateHubToken(userId) });
    }
}
