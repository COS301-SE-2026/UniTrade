using Modules.Identity.Models;
using Modules.Listings.Models;

namespace Modules.Wishlist.Models;

public class WishlistItem
{
    public int WishlistId { get; set; }
    public Guid StudentId { get; set; }
    public Guid ListingId { get; set; }
    public DateTime AddedAt { get; set; }
    public StudentProfile? Student { get; set; }
    public Listing Listing { get; set; }
}