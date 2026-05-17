using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace Api.Middleware;

public class AuthMiddleware(RequestDelegate next, IConfiguration config)
{
    private readonly RequestDelegate _next = next;
    private readonly IConfiguration _config = config;

    public async Task InvokeAsync(HttpContext context)
    {
        var token = context.Request.Cookies["jwt"];

        if (!string.IsNullOrEmpty(token))
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var secret = _config["Jwt:Secret"]?? throw new InvalidOperationException("JWT:Secret was not configured");
                var key = Encoding.UTF8.GetBytes(secret);
                var parameters = new TokenValidationParameters
                {
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ClockSkew = TimeSpan.Zero

                };
                var principal = tokenHandler.ValidateToken(token, parameters, out _);

                context.User = principal;
            }
            catch
            {
                //invalid token 
                context.User = new ClaimsPrincipal(new ClaimsIdentity());
            }
        }
        await _next(context);

    }

}