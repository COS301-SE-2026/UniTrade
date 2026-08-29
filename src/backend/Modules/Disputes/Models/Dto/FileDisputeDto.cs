namespace Modules.Disputes.Models.Dto;

public class FileDisputeDto
{
    public string Type { get; set; } = string.Empty;//listinquality
    public Guid? ReservationId { get; set; }
    public Guid? ListingId { get; set; }
    public Guid? MeetupId { get; set; }
    public List<string>? Photos { get; set; }
    public bool? SellerRefusedPhotos { get; set; }
    public string? Description { get; set; }

}

public record FileDisputeResultDto(Guid CaseId);
