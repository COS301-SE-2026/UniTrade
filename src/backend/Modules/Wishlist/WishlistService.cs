using System.Text.Json;
using Modules.Listings.Models.Dto;
using Modules.Listings.Repositories;
using Modules.Wishlist.Models;
using Modules.Wishlist.Models.Dto;
using Modules.Wishlist.Repositories;

namespace Modules.Wishlist;

public class WishlistService : IWishlistService
{
    private readonly IWishlistRepository _wishlist;
    private readonly IListingRepository _listings;

    public WishlistService(IWishlistRepository wishlist, IListingRepository listings)
    {
        _listings = listings;
        _wishlist = wishlist;
    }

    public async Task<IReadOnlyList<WishlistItemDto>> ListAsync(
        Guid studentId,
        CancellationToken ct = default
    )
    {
        var items = await _wishlist.ListForStudentAsync(studentId, ct);
        return items.Select(w => MapToDto(w)).ToList();
    }

    public async Task<WishlistItemDto> AddAsync(
        Guid studentId,
        Guid listingId,
        CancellationToken ct = default
    )
    {
        var listing =
            await _listings.GetByIdAsync(listingId)
            ?? throw new WishlistException(WishlistErrors.ListingNotFound);

        if (listing.ListingStatus is "reserved" or "sold" or "removed")
        {
            throw new WishlistException(WishlistErrors.ListingUnavailable);
        }

        var existing = await _wishlist.GetAsync(studentId, listingId, ct);
        if (existing is not null)
        {
            throw new WishlistException(WishlistErrors.AlreadyWishlisted);
        }
        var wishlistItem = new WishlistItem
        {
            StudentId = studentId,
            ListingId = listingId,
            AddedAt = DateTime.UtcNow,
        };

        await _wishlist.AddAsync(wishlistItem, ct);
        await _wishlist.SaveAsync(ct);

        var saved = await _wishlist.ListForStudentAsync(studentId, ct);
        var created = saved.First(w => w.ListingId == listingId);
        return MapToDto(created);
    }

    public async Task<bool> RemoveAsync(
        Guid studentId,
        Guid listingId,
        CancellationToken ct = default
    ) => await _wishlist.RemoveAsync(studentId, listingId, ct);

    public async Task CleanForListingAsync(Guid listingId, CancellationToken ct = default) =>
        await _wishlist.RemoveAllForListingAsync(listingId, ct);

    public static WishlistItemDto MapToDto(WishlistItem w)
    {
        var l = w.Listing!;
        var listing = new ListingSummaryDto(
            ListingId: l.ListingId,
            SellerId: l.SellerId,
            Title: l.Title,
            Description: l.Description,
            Price: l.Price,
            Condition: l.Condition,
            CourseId: l.CourseId,
            CategoryId: l.CategoryId,
            CategoryName: l.Category?.Name ?? string.Empty,
            Metadata: string.IsNullOrEmpty(l.Metadata)
                ? null
                : JsonDocument.Parse(l.Metadata).RootElement,
            BookDetails: l.BookDetails is null
                ? null
                : new BookDetailsDto
                {
                    Isbn = l.BookDetails.Isbn,
                    Author = l.BookDetails.Author,
                    Edition = l.BookDetails.Edition,
                },
            ListingStatus: l.ListingStatus,
            IsBundle: l.IsBundle ?? false,
            ViewCount: l.ViewCount ?? 0,
            CreatedAt: l.CreatedAt,
            UpdatedAt: l.UpdatedAt,
            Images: l.Images.OrderByDescending(i => i.IsPrimary)
                .Select(i => new ListingImageDto(
                    i.ImageId,
                    $"/api/listings/{l.ListingId}/images/{i.ImageId}",
                    i.IsPrimary
                ))
                .ToList(),
            Seller: l.Seller is null
                ? null
                : new SellerInfoDto(
                    l.Seller.SellerId,
                    l.Seller.FirstName,
                    l.Seller.LastName,
                    l.Seller.FullName,
                    l.Seller.University,
                    l.Seller.ActiveListingCount
                )
        );
        return new WishlistItemDto(w.WishlistId, w.ListingId, w.AddedAt, listing);
    }

    public async Task SuppressForListingAsync(
        Guid listingId,
        Guid reservationId,
        CancellationToken ct = default
    ) => await _wishlist.SuppressAllForListingAsync(listingId, reservationId, ct);

    public async Task RestoreForReservationAsync(
        Guid reservationId,
        CancellationToken ct = default
    ) => await _wishlist.RestoreForReservationAsync(reservationId, ct);
}
