namespace Modules.Disputes.Models.Dto;

public class UserListingDto
{
    public Guid ListingId { get; set; }
    public string Title { get; set; } = "";
    public string Status { get; set; } = "";
    public decimal Price { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? ImageUrl { get; set; }
}
