using API.Modules.Identity.Models.DTO;
using API.Modules.Identity;
using API.Modules.Identity.Models;

namespace API.Controllers
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
        public async Task<IActionResult> Login(LoginDTO loginDto)
        {
            var response=await _identityService.LoginAsync(loginDto);//busines loic layer comes in
            //remember to set cookiee!!!



            
            return ok(response);
        }

    }
}