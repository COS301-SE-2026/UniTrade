using Modules.Listings.Models;
using Modules.Listings.Models.DTO;

namespace Modules.Listings
{
    public class ListingsService: IListingsService
    {
        ///connect to db/repo--> make sure to change this to repo like zee's structure!!!
        /// 
        //for now connecting to the 
        private readonly AppDbContext _dbContext;

        public class ListingsService(AppDbContext dbContext)
        {
            _dbContext=dbContext;
        }

        public async Task<Listings> CreateListings(ListingsDto listings)
        {
            //link dto to model. update server side
            var newlistings=new Listing
            {
                Title=listings.Title,
                Description=listings.Description,
                Price=listing.Price,
                Condition=listings.condition
                Created_at=DateTime.UtcNow
            }

            //update db (iinsert)
            _dbContext.Listings.Add(newlistings);
            await _dbContext.SaveChangesAsync();

            return newlistings;
        }

        public async Task<bool> UpdateListings(ListingsDto listings, int id)
        {
            var listingLookUp=await _dbContext.Listing.FindAsync(id);
            if(listingLookUp==null)
            { 
                return false;
            }

            listingLookUp.Title=listings.Title;
            listingLookUp.Description=listings.Description;
            listingLookUp.Price=listings.Price;
            listingLookUp.Condition=listings.Condition;
            listingLookUp.Updated_at=DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();

            return true;
        }

        public async Task<bool> DeleteListings(int id)
        {
            var listing=await _db.Listings.FindAsync(id);

            if (listing==null)
            {
                return false;
            } 

            _dbContext.Listings.Remove(listing);
            await _dbContext.SaveChangesAsync();

            return true;
        }
    }
}


