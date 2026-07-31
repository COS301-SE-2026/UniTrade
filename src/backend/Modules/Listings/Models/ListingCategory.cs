namespace Modules.Listings.Models;

public class ListingCategory
{
    public int CategoryId { get; set; }
    public string Name { get; set; } = "";
    public bool IsActive { get; set; } = true;

    public ICollection<Listing> Listings { get; set; } = new List<Listing>();
}
