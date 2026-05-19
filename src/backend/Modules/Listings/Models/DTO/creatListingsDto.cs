namespace Modules.Listings.Models.DTO
{
    public class CreateListingsDto
    {
        //remeber dto is the client reqq!!!
        [Required] //fail-fast property(see if there is more stricter ones to add later)
        public string Title{get;set;}

        public string Description{get;set;}

        [Required]
        public NUMERIC Price{get;set;}

        [Required]
        public string Condition{get;set;}
    }
}