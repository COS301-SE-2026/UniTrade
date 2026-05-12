///this is just a template from google
[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _config;
    // Assuming you have a DB context and a service for validation
    private readonly IAuthService _authService;

    public AuthController(IConfiguration config, IAuthService authService)
    {
        _config = config;
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto request)
    {
        // 1. Validate credentials (check user & hashed password)
        var user = await _authService.ValidateUser(request.Username, request.Password);
        
        if (user == null) 
            return Unauthorized(new { message = "Invalid Username or Password" });

        // 2. Generate JWT Token
        var token = _authService.GenerateJwtToken(user);

        // 3. Return Token
        return Ok(new { token = token });
    }
}
