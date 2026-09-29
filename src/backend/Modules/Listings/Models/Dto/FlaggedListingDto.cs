namespace Modules.Listings.Models.Dto;

public record FlaggedListingDto(
    Guid ListingId,
    string Title,
    decimal Price,
    Guid SellerId,
    string SellerInitials,
    decimal RiskScore,
    string RiskLevel,
    List<string> Reasons,//ireadonlylist?
    double? ImageMatchScore,//for clip
    DateTime CreatedAt,
    int CopyCount = 1
);

// public record FlaggedListingRow(
//     Guid ListingId,
//     string Title,
//     decimal Price,
//     Guid SellerId,
//     string FirstName,
//     string LastName,
//     decimal? AiRiskScore,
//     string? AiRiskLevel,
//Listingstring[]? RiskReasons,
//     DateTime CreatedAt
// );
