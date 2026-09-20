namespace Modules.Listings.Models.Dto;

public sealed record SellerListingStatusDto(Guid ListingId, string Status, string RiskLevel, string Message);
