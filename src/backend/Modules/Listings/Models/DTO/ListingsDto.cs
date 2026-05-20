namespace Modules.Listings.Models.DTO
{
    public class ListingsDto
    {
        //remeber dto is the client reqq!!!
         //fail-fast property(see if there is more stricter ones to add later)
        public string Title{get;set;}

        public string Description{get;set;}

        
        public decimal Price{get;set;}

        public string Condition{get;set;}
    }
}