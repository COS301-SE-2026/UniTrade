namespace Modules.Listings.Models;

public record SellerInfo(Guid SellerId, string FirstName, string LastName, string? University, int ActiveListingCount)
{
    public string FullName => $"{FirstName} {LastName}".Trim();
}
