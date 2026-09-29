using Modules.Listings.Models.Dto;

namespace Modules.Listings.Admin;

public interface IAdminListingRiskService
{
    Task<IReadOnlyList<FlaggedListingDto>> GetFlaggedAsync(string status, CancellationToken ct = default);
    Task<ListingSummaryDto?> DecideAsync(Guid listingId, string action, string reason, Guid adminId, CancellationToken ct = default);
    Task<FlaggedListingDetailDto?> GetFlaggedDetailAsync(Guid listingId, CancellationToken ct = default);
}
