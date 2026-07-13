namespace Modules.Wishlist;

public sealed class WishlistException(string code) : Exception(code)
{

}

public static class WishlistErrors
{
    public const string ListingNotFound = "listing_not_found";
    public const string NotFound = "not_found";
    public const string AlreadyWishlisted = "already_wishlisted";
    public const string ListingUnavailable = "listing_unavailable";

}