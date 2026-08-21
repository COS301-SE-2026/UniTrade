namespace Modules.Identity.Verification;

public interface ISellerVerificationQuery
{
    Task<bool> IsVerifiedAsync(Guid userId, CancellationToken ct = default);
}
