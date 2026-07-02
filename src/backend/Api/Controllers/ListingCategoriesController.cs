using Modules.Listings.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/listing-categories")]

public class ListingCategoriesController: ControllerBase
{
    private readonly IListingRepository _listingsrepo;

    public ListingCategoriesController(IListingRepository listingsrepo)
    {
        _listingsrepo=listingsrepo;
    }

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetActiveCategoriesAsync()
    {
        var categories=await _listingsrepo.GetActiveCategories();
        var result=categories.Select(category=>new
        {
            id=category.ListingCategoryId,
            name=category.Name,
        });
        return Ok(result);
    }
}