namespace Modules.Listings.Models;
using Modules.Listings.Models.DTO;

{
    public interface IListingsService
    {
        ListingsDto CreateListings(ListingsDto listings);
        bool UpdateListings();
        bool DeleteLsitings();

    }
}