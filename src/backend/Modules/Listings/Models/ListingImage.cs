using Modules.Listings.Models;

namespace Modules.Listings.Models;

public class ListingImage
{
    public int ImageId { get; set; }
    public Guid ListingId { get; set; }
    public string ImageUrl { get; set; } = "";

    public bool IsPrimary { get; set; }
    public DateTime UploadedAt { get; set; }
    public Listing? Listing { get; set; }

}