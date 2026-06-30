namespace Modules.Listings.Models.Dto;

public class UpdateListingDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Condition { get; set; } = string.Empty;

    public List<int>? RemovedImageIds { get; set; }
}
