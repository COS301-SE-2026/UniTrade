using Modules.Listings.Models;

namespace Modules.Listings.Models;

public class ListingImage
{
    public int ImageId { get; set; }
    public Guid ListingId { get; set; }
    public byte[] ImageData { get; set; } = default!;

    public string ContentType { get; set; } = default!;
    public int FileSize { get; set; }
    public bool IsPrimary { get; set; }
    public DateTime UploadedAt { get; set; }
    public Listing? Listing { get; set; } = default!;
}
