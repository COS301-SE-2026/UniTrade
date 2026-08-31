using Modules.Reservations.Models;

namespace Modules.Listings.Models.Dto
{
    public class ListingSnapshotDto
    {
        public string Title { get; set; } = null!;
        public decimal Price { get; set; }
        public string Condition { get; set; } = null!;
        public List<string>? PhotoRefs { get; set; }
        public List<string>? CourseTags { get; set; }
        public DateTime CapturedAt { get; set; }
        public Guid? SnapshotId { get; set; }
        public Guid ListingId { get; set; }
    }
}
