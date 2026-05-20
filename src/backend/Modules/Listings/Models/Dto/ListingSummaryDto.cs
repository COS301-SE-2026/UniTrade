using Modules.Listings.Modules.Dto;
using Modules.Listings.Modules;
public record ListingSummaryDto
(
    Guid ListingId,
    Guid SellerId,
     string SellerName,
     string Title,
     string Description,
     decimal Price,
     string Condition,
     string ListingType,
     int? CourseId,
     string? Isbn,
     string? Author,
     string? Edition,
     string ListingStatus,

     DateTime CreatedAt,
     DateTime UpdatedAt,

     IReadOnlyList<ListingImageDto> Images
);