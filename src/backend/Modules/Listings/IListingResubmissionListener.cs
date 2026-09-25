namespace Modules.Listings;

public interface IListingResubmissionListener 
{
    Task OnListingResubmittedAsync(Guid listingId, CancellationToken ct = default);
}