using Modules.Identity.Models.DTO;
using Modules.Identity;
using Modules.Identity.Models;
using Microsoft.AspNetCore.Mvc; 

namespace Api.Controllers
{
    [Route("api/auth")]
    [ApiController]

    public class AuthController:ControllerBase
    {

        private readonly IIdentityService _identityService;
        public AuthController(IIdentityService identityService)
        {
            _identityService=identityService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody]LoginDTO request)
        {
        try{

            if(string.IsNullOrEmpty(request.Email)|| string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new {message="Email and password are required"});
            }
            var response=await _identityService.LoginAsync(request);//business logic layer comes in. It gives us the results

            if(response==null||response.User==null)
            {
                return Unauthorized(new {message="Invalid credentials"});
            }

            Response.Cookies.Append("authToken",response.Token!,new CookieOptions
            {
                HttpOnly=true,
                Secure=true,
                SameSite=SameSite.Lax
            });

            return Ok(new 
            {
                response.Message,
                response.User
            }
            );
        }
        catch(Exception e)
        {
            return StatusCode(500,new{message="An internal server error occurred"});
        }
    }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete("authToken", new CookieOptions
            {
                HttpOnly=true,
                Secure=true,
                SameSite=SameSiteMode.Lax
            });
            return Ok(new 
            {
                message="Logged out successfully"
            });
        }

    }
}
