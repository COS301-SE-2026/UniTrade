namespace Modules.Listings.Models.Dto;

public record SellerInfoDto(
    Guid SellerId,
    string FirstName,
    string LastName,
    string FullName,
    string? University,
    int ActiveListingCount
);
