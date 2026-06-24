using Modules.Listings.Models;
namespace Infrastructure.Storage.Repositories;

public interface IListingImageRepository
{
    Task<int> AddAsync(ListingImage image, CancellationToken ct = default);
    Task<(byte[] Data, string ContentType)?> GetDataAsync(int imageId, CancellationToken ct = default);
    Task DeleteAsync(int imageId, CancellationToken ct = default);
}