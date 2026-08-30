using System.Linq.Expressions;
using BCrypt.Net;
using Infrastructure.Notifications;
using Microsoft.AspNetCore.Mvc;
using Modules.Identity;
using Modules.Identity.Models;
using Modules.Identity.Repositories;

namespace Api.Controllers;

[ApiController]
[Route("api/dev")]
public class DevController : ControllerBase
{
    private readonly IWebHostEnvironment _env;

    public DevController(IWebHostEnvironment env)
    {
        _env = env;
    }

    [HttpGet("otp")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public IActionResult GetOtp([FromQuery] string email)
    {
        if (!_env.IsDevelopment())
        {
            return NotFound();
        }

        var otp = TestEmailService.GetLastOtp(email);
        if (otp == null)
        {
            return NotFound(new { error = "no_otp_found" });
        }

        return Ok(new { otp });
    }

    [HttpPost("admin")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> CreateAdmin(
        [FromServices] IUserRepository users,
        CancellationToken ct
    )
    {
        if (!_env.IsDevelopment())
        {
            return NotFound();
        }
        try
        {
            const string email = "e2e-admin@tuks.co.za";
            const string password = "Admin123&*"; // NOSONAR

            var existing = await users.GetByEmailAsync(email);

            if (existing is null)
            {
                var user = new User
                {
                    UserId = Guid.NewGuid(),
                    FirstName = "E2E",
                    LastName = "Admin",
                    Email = email,
                    PhoneNumber = "",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                    Role = "admin",
                };

                await users.AddAsync(user);
            }
            return Ok(new { email, password });
        }
        catch (Exception ex)
        {
            return StatusCode(
                500,
                new
                {
                    error = ex.Message,
                    stack = ex.StackTrace,
                    inner = ex.InnerException?.Message,
                }
            );
        }
    }
}
