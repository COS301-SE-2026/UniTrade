namespace Modules.Listings.Models.Dto;

public class CreateListingDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Condition { get; set; } = string.Empty;
    public string ListingType { get; set; } = string.Empty;
    public Guid SellerId { get; set; }
    public string ListingStatus { get; set; } = "live";
    public int? CourseId { get; set; }
    public string? Isbn { get; set; }
    public string? Author { get; set; }
    public string? Edition { get; set; }
    public bool IsBundle { get; set; } = false;
    public List<CreateListingImageDto> Images { get; set; } = new();
}

public class CreateListingImageDto
{
    public string ImageUrl { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
}