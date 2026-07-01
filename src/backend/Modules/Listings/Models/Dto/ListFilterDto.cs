namespace Modules.Listings.Models.Dto;

public class ListFilterDto
{
    public string? ListingType { get; set; }
    public string? ListingStatus { get; set; }
    public int? CourseId { get; set; }
    public Guid? SellerId { get; set; }
    public string? Search { get; set; }
}
