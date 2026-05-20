using Microsoft.AspNetCore.Mvc;
using Modules.Identity.Models.Dto;
using Modules.Identity.Models.DTO;
using Modules.Identity;
using Modules.Identity.Verification;
using Modules.Identity.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;

namespace Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IIdentityService _identityService;
    private readonly IVerificationService _verificationService;

    public AuthController(
        IIdentityService identityService,
        IVerificationService verificationService)
    {
        _identityService = identityService;
        _verificationService = verificationService;
    }


    [HttpPost("register")]
    [EnableRateLimiting("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        try
        {
            var user = await _identityService.RegisterAsync(dto);

            await _verificationService.InitiateAsync(user.Email, user.UserId);

            return Ok(new
            {
                message = "OTP sent to your email."
            });
        }
        catch (Exception ex)
        {
            return ex.Message switch
            {
                "invalid_email" => UnprocessableEntity(new { error = "invalid_email" }),
                "invalid_year_of_study" => UnprocessableEntity(new { error = "invalid_year_of_study" }),
                "email_taken" => Conflict(new { error = "email_taken" }),
                "otp_already_sent" => StatusCode(429, new { error = "otp_already_sent" }),
                "invalid_domain" => UnprocessableEntity(new { error = "invalid_domain" }),
                "weak_password" => UnprocessableEntity(new { error = "weak_password" }),
                _ => StatusCode(500, new { error = "server_error" })
            };
        }
    }

    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto dto)
    {
        try
        {
            var user = await _identityService.GetUserByEmailAsync(dto.Email);

            if (user == null)
                return Unauthorized(new { error = "invalid_otp" });


            await _verificationService.VerifyAsync(user.UserId, dto.Otp);

            return Ok(new
            {
                message = "Verified successfully."
            });
        }
        catch (Exception ex)
        {
            return ex.Message switch
            {
                "invalid_otp" => Unauthorized(new { error = "invalid_otp" }),
                "otp_expired" => Unauthorized(new { error = "otp_expired" }),
                "max_attempts_exceeded" => StatusCode(429, new { error = "max_attempts_exceeded" }),
                _ => StatusCode(500, new { error = "server_error" })
            };
        }
    }

    [HttpPost("resend-otp")]
    public async Task<IActionResult> ResendOtp([FromBody] ResendOtpDto dto)
    {
        try
        {
            var user = await _identityService.GetUserByEmailAsync(dto.Email);

            if (user == null)
            {
                // this prevents email enumeration (always return success)
                return Ok(new
                {
                    message = "If this email is registered and pending verification, a new OTP has been sent."
                });
            }

            await _verificationService.ResendAsync(user.UserId, dto.Email);

            return Ok(new
            {
                message = "If this email is registered and pending verification, a new OTP has been sent."
            });
        }
        catch (Exception ex)
        {
            return ex.Message switch
            {
                "already_verified" => Conflict(new { error = "already_verified" }),
                "invalid_request" => BadRequest(new { error = "invalid_request" }),
                "resend_limit_exceeded" =>
                    StatusCode(429, new { error = "resend_limit_exceeded", retry_after_seconds = 60 }),

                "cooldown_active" =>
                    StatusCode(429, new { error = "cooldown_active", retry_after_seconds = 60 }),

                _ => StatusCode(500, new { error = "server_error" })
            };
        }
    }

    [HttpPost("login")]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> Login([FromBody] LoginDTO request)
    {
        try
        {


            var token = await _identityService.LoginAsync(request);//business logic layer comes in. It gives us the results

            Response.Cookies.Append("authToken", token, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Lax,
                Expires = DateTimeOffset.UtcNow.AddHours(24)
            });

            return Ok(new
            {
                message = "Login successful"
            }
            );
        }
        catch (Exception e)
        {
            return e.Message switch
            {
                "invalid_credentials" => Unauthorized(new { error = "invalid_credentials" }),
                _ => StatusCode(500, new { error = "server_error" })
            };
        }
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("authToken", new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax
        });
        return Ok(new
        {
            message = "Logged out successfully"
        });
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        try
        {
            //'USer' here is built in. .net puts all jwt claims in this Object when client requests
            var userId=User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new{ error="unauthenticated"});
            }

            var result = await _identityService.GetMeAsync(userId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return ex.Message switch
            {
            "not_found"=> Unauthorized(new { error="unauthenticated" }),_ => StatusCode(500, new { error = "server_error" })
            };
        }
    }
}