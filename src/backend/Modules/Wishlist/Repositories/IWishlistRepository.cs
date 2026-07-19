using Modules.Wishlist.Models;

namespace Modules.Wishlist.Repositories;

public interface IWishlistRepository
{
    Task<WishlistItem?> GetAsync(Guid studentId, Guid listingId, CancellationToken ct = default);
    Task<IReadOnlyList<WishlistItem>> ListForStudentAsync(Guid student, CancellationToken ct = default);
    Task AddAsync(WishlistItem item, CancellationToken ct = default);
    Task SaveAsync(CancellationToken ct = default);
    Task<bool> RemoveAsync(Guid studentId, Guid listingId, CancellationToken ct = default);
    Task RemoveAllForListingAsync(Guid listingId, CancellationToken ct = default);
    Task SuppressAllForListingAsync(Guid listingId, Guid reservationId, CancellationToken ct = default);

    Task RestoreForReservationAsync(Guid reservationId, CancellationToken ct = default);

}