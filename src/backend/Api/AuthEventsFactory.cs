using Microsoft.AspNetCore.Authentication.JwtBearer;
namespace Api;
static class AuthEventsFactory
{
    public static JwtBearerEvents CreateJwtEvents()=> new()
    {
        OnMessageReceived = ctx =>
            {
                if (ctx.HttpContext.Request.Path.StartsWithSegments("/chathub"))
                {
                    var accessToken = ctx.Request.Query["access_token"];
                    if (!string.IsNullOrEmpty(accessToken))
                    {
                        ctx.Token = accessToken;
                        return Task.CompletedTask;
                    }
                }

                var token = ctx.Request.Cookies["authToken"];
                if (!string.IsNullOrEmpty(token))
                {
                    ctx.Token = token;
                }
                return Task.CompletedTask;
            },
            OnAuthenticationFailed = ctx =>
            {
                return Task.CompletedTask;
            },
            OnTokenValidated = ctx =>
            {
                var isHub = ctx.HttpContext.Request.Path.StartsWithSegments("/chathub");
                var aud = ctx.Principal?.FindFirst("aud")?.Value;
                if (aud == "chat-hub" && !isHub)
                {
                    ctx.Fail("hub token used outside the hub");
                }
                return Task.CompletedTask;
            },
            OnChallenge = ctx =>
            {
                return Task.CompletedTask;
            },
    };
}
