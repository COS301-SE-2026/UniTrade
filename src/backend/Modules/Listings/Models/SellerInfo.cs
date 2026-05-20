namespace Modules.Listings.Models;

public record SellerInfo(Guid SellerId, string FirstName, string LastName)
{
    public string FullName => $"{FirstName} {LastName}".Trim();
}