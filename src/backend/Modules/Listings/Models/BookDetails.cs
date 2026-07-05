namespace Modules.Listings.Models;

public class BookDetails
{
    public Guid ListingId { get; set; }
    public Listing? Listing { get; set; }

    public string? Isbn { get; set; }
    public string? Author { get; set; }
    public string? Edition { get; set; }
}
