namespace Modules.Disputes.Models.Dto;

public sealed class DisputeCaseData
{
    public Guid DisputeId { get; set; }
    public string Type { get; set; } = null!;
    public string Status { get; set; } = null!;
    public Guid SubjectUserId { get; set; }
    public Guid? ReservationId { get; set; }
    public Guid? ListingId { get; set; }
    public bool SellerRefusedPhotos { get; set; }
    public List<string> Photos { get; set; } = new();
    public string? Description { get; set; }
    public DateTime SubmittedAt { get; set; }
    public Guid RaisedBy { get; set; }
    public Guid? BuyerId { get; set; }
    public Guid? SellerId { get; set; }
    public Guid? MeetupId { get; set; }
    public bool BuyerCheckedIn { get; set; }
    public DateTime? BuyerCheckInTime { get; set; }
    public bool SellerCheckedIn { get; set; }
    public DateTime? SellerCheckInTime { get; set; }
    public string? PinStatus { get; set; }
    public DateTime? CheckInWindowClosesAt { get; set; }

    public Guid? SnapshotId { get; set; }

}
