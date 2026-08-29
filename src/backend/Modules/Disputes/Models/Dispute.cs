namespace Modules.Disputes.Models;

// I just added this for the sake of getting the quality decision done ..
// feel free to change it to your implementation

public class Dispute
{
    public Guid DisputeId { get; set; }
    public Guid RaisedBy { get; set; }
    public Guid AgainstUser { get; set; } // subject user id
    public Guid? ReservationId { get; set; }
    public Guid? ListingId { get; set; }
    public string DisputeType { get; set; } = null!;
    public string Status { get; set; } = null!;
    public string? Description { get; set; }
    public bool SellerRefusedPhotos { get; set; }
    public List<string>? Photos { get; set; } // the actual evidence photos
    public Guid? AssignedAdminId { get; set; }
    public string? Resolution { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
}
