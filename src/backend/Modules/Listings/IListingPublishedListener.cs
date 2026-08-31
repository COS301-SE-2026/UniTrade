namespace Modules.Listings;

public interface IListingPublishedListener
{
    Task OnListingPublishedEventAsync(ListingPublishedEvent @event, CancellationToken ct);
}

public class ListingPublishedEvent
{
    public Guid ListingId { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public int? CategoryId { get; set; }
    public Guid? CourseId { get; set; }
    public Guid SellerId { get; set; }
}
