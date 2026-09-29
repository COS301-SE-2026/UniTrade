namespace Modules.Reputation;

public interface IAccountSanctionService
{
    Task ApplyStrikeAsync(
        Guid userId,
        Guid? sourceCaseId,
        string type,
        string reason,
        Guid adminId,
        string scope,
        CancellationToken ct = default
    );

    Task LiftExpiredSuspensionsAsync(CancellationToken ct = default);
}
