namespace Modules.Identity;

public sealed record PartyIdentity(Guid UserId, string FirstName, string LastName, string? University, decimal SellerTrustScore, decimal BuyerReliabilityScore);

public interface IPartyDirectory
{
    Task<PartyIdentity?> GetAsync(Guid userId, CancellationToken ct = default);
}
