using Modules.Listings.Models.Dto;
using System.Text.Json;
using System.Collections.Generic;


namespace Modules.Listings.Models.Dto;

public record ListingSummaryDto(
    Guid ListingId,
    Guid SellerId,
     //string SellerName,
     string Title,
     string Description,
     decimal Price,
     string Condition,
     int CategoryId,
     string CategoryName,
     int? CourseId,
     JsonElement? Metadata,
     BookDetailsDto? BookDetails,
     string ListingStatus,  
    bool IsBundle, int ViewCount,

     DateTime CreatedAt,
     DateTime UpdatedAt,

     IReadOnlyList<ListingImageDto> Images
);
