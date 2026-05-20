using Modules.Listings.Models.Dto;

namespace Modules.Listings.Models.Dto;

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
    bool IsBundle, int ViewCount,

     DateTime CreatedAt,
     DateTime UpdatedAt,

     IReadOnlyList<ListingImageDto> Images
);