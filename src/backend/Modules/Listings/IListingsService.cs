namespace Modules.Listings.Models;
using Modules.Listings.Models.DTO;

{
    public interface IListingsService
    {
        Task<Listings> CreateListings(ListingsDto listings);//retruning a listings-> so when
        //users can see WHEN it was created and so on.P.s could be void, but retruning is stardard procedure.
        Task<bool> UpdateListings(ListingsDto listings, int id);
        Task<bool> DeleteListings(int id);

    }
}