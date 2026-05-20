
using Modules.Listings.Model;

namespace Modules.Listings.Model
{
    public class Listing
    {
        public Guid Listing_id{get;set;}
        public Guid Seller_id{get;set;}
        public int Course_id{get;set;}
        public string Title{get;set;}
        public string Description{get;set;}
        public decimal Price{get;set;}
        public string Condition{get;set;}
        public string Listing_status{get;set;}
        public decimal Ai_risk_score{get;set;}
        public string Ai_risk_level{get;set;}
        public int Visibility_score{get;set;}
        public bool Is_bundle{get;set;}
        public string Rejection_reason{get;set;}
        public DateTime Created_at{get;set;}
        public DateTime Updated_at{get;set;}
    }
}