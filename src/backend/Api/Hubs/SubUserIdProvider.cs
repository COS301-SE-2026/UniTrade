using Microsoft.AspNetCore.SignalR;

namespace Api.Hubs;

public class SubUserIdProvider : IUserIdProvider
{
    public string? GetUserId(HubConnectionContext connection)
    {
        var id =
            connection.User?.FindFirst("sub")?.Value
            ?? connection.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        Console.WriteLine(
            $"Signal R resolved user: {id ?? "NULL"} | authenticated: {connection.User?.Identity?.IsAuthenticated}"
        );

        return id;
    }
}
