namespace Modules.Listings.Models.Dto;

public class ListFilterDto
{
    public int? CategoryId{get;set;}
    public string? ListingType { get; set; }
    public string? ListingStatus { get; set; }
    public int? CourseId { get; set; }
    public Guid? SellerId { get; set; }
    public string? Search { get; set; }
    public int Skip {get;set;}=0;
    public int Take{get;set;}=50;
}
