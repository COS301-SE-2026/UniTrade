using Modules.Identity.Repositories;

namespace Modules.Identity;

public class PartyDirectory : IPartDirectory
{
    private readonly IUserRepository _users;

    public PartyDirectory(IUserRepository users) => _users = users;

    public async Task<PartyIdentity?> GetAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _users.GetByIdAsync(userId);
        if (user is null)
        {
            return null;
        }
        var studentProfileFetched = user.StudentProfile;
        return new PartyIdentity(
            user.UserId,
            user.FirstName,
            user.LastName,
            studentProfileFetched?.University?.Name,
            studentProfileFetched?.SellerTrustScore ?? 0m,
            studentProfileFetched?.BuyerReliabilityScore ?? 0m
        );
    }
}
