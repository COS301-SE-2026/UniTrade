using Modules.Listings.Models;

namespace Modules.Disputes.Models;

public class Dispute
{
    public Guid DisputeId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = "pending";//underreview, resolved,and dismissed
    public Guid SubjectUserId { get; set; }
    public Guid? RaisedBy { get; set; }

    public Guid? ReservationId { get; set; }
    public Guid? ListingId { get; set; }
    public int? MeetupId { get; set; }

    public bool SellerRefusedPhotos { get; set; }
    public List<string>? Photos { get; set; } = new();
    public string? Description { get; set; }

    public DateTime SubmittedAt { get; set; }

    public Guid? AssignedAdminId { get; set; }
    public string? Resolution { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public Guid? SnapshotId { get; set; }
    public ListingSnapshot? Snapshot { get; set; }
}
