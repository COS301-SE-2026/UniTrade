using Modules.Identity.Repositories;

namespace Modules.Identity.Verification;

public class SellerVerificationQuery : ISellerVerificationQuery
{
    private readonly IUserRepository _users;

    public SellerVerificationQuery(IUserRepository users) => _users = users;

    public async Task<bool> IsVerifiedAsync(Guid userId, CancellationToken ct = default)
    {
        var userFetched = await _users.GetByIdAsync(userId);
        return userFetched?.StudentProfile?.VerificationStatus == "verified";
    }
}
