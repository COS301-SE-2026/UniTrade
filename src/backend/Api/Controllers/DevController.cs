using Infrastructure.Notifications;
using Microsoft.AspNetCore.Mvc;

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
}
