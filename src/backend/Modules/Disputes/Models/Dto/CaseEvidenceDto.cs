using Modules.Listings.Models.Dto;

namespace Modules.Disputes.Models.Dto;

public class CaseEvidenceDto
{
    public string? University { get; set; }
    public string? Degree { get; set; }
    public int? Year { get; set; }
    public string? Email { get; set; }
    public bool? DomainValid { get; set; }

    public ListingSnapshotDto? Snapshot { get; set; }
    public List<string>? BuyerPhotos { get; set; }
    public bool? SellerRefusedPhotos { get; set; }

    public Guid? ListingId { get; set; }
    public string? ReportReason { get; set; }

    public Guid? MeetupId { get; set; }
    public bool? BuyerCheckedIn { get; set; }
    public DateTime? BuyerCheckInTime { get; set; }
    public bool? SellerCheckedIn { get; set; }
    public DateTime? SellerCheckInTime { get; set; }
    public string? PinStatus { get; set; }
    public DateTime? CheckInWindowClosesAt { get; set; }
}
