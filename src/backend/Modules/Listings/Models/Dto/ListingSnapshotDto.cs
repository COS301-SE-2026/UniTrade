namespace Modules.Listing.Models.Dto
{
    public class ListingSnapshot
    {
        public string Title {get;set;}=null!;
        public decimal Price {get;set;}
        public string Condition{ get;set;}
        public List<string>? PhotoRefs{get;set;}
        public List<string>? CourseTags{get;set;}
        public DateTime CapturedAt{get;set;}
        public Reservation reservation {get;set;}=null!;
        public Listing listing {get;set;}=null!;
    }
}