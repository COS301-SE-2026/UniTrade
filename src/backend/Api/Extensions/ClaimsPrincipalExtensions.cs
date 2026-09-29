using System.Security.Claims;

namespace Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static bool IsAdmin(this ClaimsPrincipal user) =>
        user.IsInRole("admin")
        || string.Equals(user.FindFirst("role")?.Value, "admin", StringComparison.OrdinalIgnoreCase)
        || string.Equals(user.FindFirst(ClaimTypes.Role)?.Value, "admin", StringComparison.OrdinalIgnoreCase);

}