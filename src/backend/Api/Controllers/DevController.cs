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

    [HttpGet("decision")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public IActionResult GetDecision([FromQuery] string email)
    {
        if (!_env.IsDevelopment())
        {
            return NotFound();
        }

        var decision = TestEmailService.GetLastDecision(email);
        if (decision == null)
        {
            return NotFound(new { error = "no_decision_found" });
        }

        return Ok(new { decision });
    }
}
