namespace Modules.Listings.Models.Dto;

public sealed record ReasonDetailDto(string Code, string Detail, int? ImageId = null);

public sealed record FlaggedListingSellerDto(
    Guid SellerId,
    string Name,
    string initials,
    string VerificationStatus,
    int StrikeCount,
    int PriorFlagCount
);

public sealed record FlaggedListingDetailDto(
    Guid ListingId,
    string Title,
    string Description,
    decimal Price,
    string Condition,
    string CategoryName,
    List<string> Images,
    FlaggedListingSellerDto Seller,
    decimal RiskScore,
    string RiskLevel,
    int? VisibilityScore,
    List<ReasonDetailDto> Reasons,
    double? ImageMatchScore,
    DateTime CreatedAt,
    int CopyCount = 1
);
