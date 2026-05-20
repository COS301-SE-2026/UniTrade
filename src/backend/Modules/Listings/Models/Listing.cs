using System.ComponentModel.DataAnnotations.Schema;
using System.Reflection.Metadata;

namespace Modules.Listings.Models;

public class Listing
{
    public Guid ListingId { get; set; }
    public Guid SellerId { get; set; }

    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public decimal Price { get; set; }
    public string Condition { get; set; } = "good";
    public string ListingType { get; set; } = "other";

    public int? CourseId { get; set; }
    public string? Isbn { get; set; }
    public string? Author { get; set; }
    public string? Edition { get; set; }

    public string ListingStatus { get; set; } ="";

    // not in MVP
    public decimal? AiRiskScore { get; set; }
    public string? AiRiskLevel { get; set; }
    public int? VisibilityScore { get; set; }
    public bool? isBundle { get; set; }
    public string? RejectionReason { get; set; }
    public int? ViewCount { get; set; }
    //===========


    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    [NotMapped]
    public SellerInfo? Seller { get; set; }
    public ICollection<ListingImage> Images { get; set; } = new List<ListingImage>();


}