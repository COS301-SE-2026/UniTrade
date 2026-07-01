namespace Modules.Listings.Models;

public class ListingCategory
{
    public int CategoryId{get;set;}
    public string Name {get;set;}
    public int? RootCategoryId{get;set;}
    public ListingCategory? RootCategory{get;set;}
    public bool IsActive {get;set;}=true;

    public ICollection<ListingCategory> ChildCategories{get;set;}= new List<ListingCategory>();
    public ICollection<Listing> Listings {get;set;} = new List<Listing>();

}