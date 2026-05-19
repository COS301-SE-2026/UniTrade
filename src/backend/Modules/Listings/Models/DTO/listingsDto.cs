namespace Modules.Listings.Models.DTO
{
    public class ListingsDto
    {
        public Guid Listing_id{get;set;}
        public Guid Seller_id{get;set;}
        public int Course_id{get;set;}
        public string Title{get;set;}
        public string Description{get;set;}
        public NUMERIC Price{get;set;}
        public string Condition{get;set;}
        public DateTime Created_at{get;set;}
        public DateTime Updated_at{get;set;}
    }
}