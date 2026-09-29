using Modules.Listings.Models;

namespace Modules.Listings.Repositories;

public sealed record ComparableImage(int ImageId, Guid SellerId, string? Hash, float[]? Embedding);
public interface IListingImageRepository
{
    Task<int> AddAsync(ListingImage image, CancellationToken ct = default);
    Task<(byte[] Data, string ContentType)?> GetDataAsync(
        int imageId,
        CancellationToken ct = default
    );
    Task DeleteAsync(int imageId, CancellationToken ct = default);
    Task<IReadOnlyList<ComparableImage>> GetComparableImageHashesAsync(
        Guid excludeListingId,
        CancellationToken ct = default
    );
}
