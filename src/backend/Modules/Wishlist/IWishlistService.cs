using Modules.Wishlist.Models.Dto;

namespace Modules.Wishlist;

public interface IWishlistService
{
    Task<IReadOnlyList<WishlistItemDto>> ListAsync(Guid studentId, CancellationToken ct = default);
    Task<WishlistItemDto> AddAsync(Guid studentId, Guid listingId, CancellationToken ct = default);
    Task<bool> RemoveAsync(Guid studentId, Guid listingId, CancellationToken ct = default);
    Task CleanForListingAsync(Guid listingId, CancellationToken ct = default);
    Task SuppressForListingAsync(
        Guid listingId,
        Guid reservationId,
        CancellationToken ct = default
    );

    Task RestoreForReservationAsync(Guid reservationId, CancellationToken ct = default);
}
