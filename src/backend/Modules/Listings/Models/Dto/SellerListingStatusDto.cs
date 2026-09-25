namespace Modules.Listings.Models.Dto;

public record ListingReasonDto(string Code, string? Detail, int? ImageId);

public sealed record SellerListingStatusDto(
    Guid ListingId,
    string Status,
    string RiskLevel,
    string Message,
    int? VisibilityScore = null,
    int ResubmissionCount = 0,
    int MaxResubmissions = 0,
    IReadOnlyList<ListingReasonDto>? Reasons = null,
    bool canRescore = false
);
