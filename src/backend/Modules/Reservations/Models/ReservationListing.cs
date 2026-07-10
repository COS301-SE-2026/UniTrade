using Modules.Listings.Models;

namespace Modules.Reservations.Models;

public class ReservationListing
{
    public Guid ReservationId { get; set; }
    public Guid ListingId { get; set; }

    public Reservation Reservation { get; set; } = null!;
    public Listing Listing { get; set; } = null!;
}
