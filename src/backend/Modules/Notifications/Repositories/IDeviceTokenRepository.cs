namespace Modules.Notifications.Repositories;

public interface IDeviceTokenRepository
{
    Task UpsertAsync(Guid userId, string token, string platform, CancellationToken ct = default);
    Task<IReadOnlyList<string>> GetTokensForUserAsync(Guid userId, CancellationToken ct = default);
    Task DeleteAsync(IEnumerable<string> tokens, CancellationToken ct = default);
}
