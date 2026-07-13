using Modules.Listings.Models.Dto;

namespace Modules.Wishlist.Models.Dto;

public record WishlistItemDto(
    int WishlistId, Guid ListingId, DateTime AddedAt, ListingSummaryDto Listing
);