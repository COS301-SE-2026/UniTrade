using Microsoft.AspNetCore.Mvc;
using Modules.Listings;
using Modules.Listings.Models.Dto;


namespace Api.Controllers;

[ApiController]
[Route("api/listings")]
public class ListingController : ControllerBase
{
    private readonly IListingService _listings;

    public ListingController(IListingService listings) => _listings = listings;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] ListFilterDto filter)
    {
        var result = await _listings.ListAsync(filter);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var listing = await _listings.GetByIdAsync(id);
        if (listing == null)
            return NotFound(new { error = "listing_not_found" });
        return Ok(listing);
    }
}