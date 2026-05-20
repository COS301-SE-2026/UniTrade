using Modules.Listings.Models;
using Modules.Listings.Models.DTO;
using Modules.Identity.Repositories;
using Modules.Listings.Repositories;

namespace Modules.Listings;

public class ListingsService: IListingsService
{
        ///connect to db/repo--> make sure to change this to repo like zee's structure!!!
        /// 
        //for now connecting to the 
        private readonly IUserRepository _users;
        private readonly IListingsRepository _listingrepo;
        
        
        public ListingsService(IUserRepository users,IListingsRepository listingsrepo)
        {
            _users=users;
            _listingrepo=listingsrepo;
        }

        public async Task<Listing> CreateListings(ListingsDto listings)
        {
            //link dto to model. update server side
            var newlistings=new Listing
            {
                Title=listings.Title,
                Description=listings.Description,
                Price=listing.Price,
                Condition=listings.condition,
                Created_at=DateTime.UtcNow
            };

            //repo call
            await _listingrepo.AddAsync(newlistings);

            return newlistings;
        }

        public async Task<bool> UpdateListings(ListingsDto listings, int id)
        {
            var listingLookUp=await _listingrepo.GetByIdAsync(id);
            if(listingLookUp==null)
            { 
                return false;
            }

            listingLookUp.Title=listings.Title;
            listingLookUp.Description=listings.Description;
            listingLookUp.Price=listings.Price;
            listingLookUp.Condition=listings.Condition;
            listingLookUp.Updated_at=DateTime.UtcNow;

            await _listingrepo.UpdateAsync(listingLookUp);

            return true;
        }

        public async Task<bool> DeleteListings(int id)
        {
            var listing=await _listingrepo.GetByIdAsync(id);

            if (listing==null)
            {
                return false;
            } 

            await _listingrepo.DeleteByIdAsync(id);

            return true;
        }
}



