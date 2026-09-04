using Modules.Reservations.Models;

namespace Modules.Listings.Models
{
    public class ListingSnapshot
    {
        public Guid SnapshotId { get; set; }

        public Guid ListingId { get; set; }
        public Guid? ReservationId { get; set; }

        public string Title { get; set; } = null!;
        public decimal Price { get; set; }
        public string Condition { get; set; } = null!;
        public List<string>? PhotoRefs { get; set; }
        public List<string>? CourseTags { get; set; }
        public DateTime CapturedAt { get; set; }
        public Reservation? Reservation { get; set; }
        public Listing Listing { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string? CategoryName { get; set; }
    }
}
