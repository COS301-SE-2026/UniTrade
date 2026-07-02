namespace Api.Controllers;

[ApiController]
[Route(api/listing-categories)]

public class ListingCategoriesController: ControllerBase
{
    private readonly IListingRepository _listingsrepo;

    public ListingCategoriesController(IListingRepository listingsrepo)
    {
        _listingsrepo=listingsrepo;
    }

    [AllowAnonymous]
    public async Task<
}