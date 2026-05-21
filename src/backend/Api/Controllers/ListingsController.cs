using Microsoft.AspNetCore.Mvc;
using Modules.Listings;
using Modules.Listings.Models.Dto;
using Modules.Listings.Models;

namespace Api.Controllers;

[ApiController]
[Route("api/listings")]
public class ListingController : ControllerBase
{
    private readonly IListingService _listings;

    public ListingController(IListingService listings) => _listings = listings;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ListingSummaryDto request)
    {
        if (string.IsNullOrEmpty(request.Title) || string.IsNullOrEmpty(request.Condition) || request.Price <= 0)
            return BadRequest("Field(s) missing.");

        var response = await _listings.CreateListings(request);
        return Ok(response);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update([FromBody] ListingSummaryDto request, Guid id)
    {
        var updateL = await _listings.UpdateListings(request, id);
        if (!updateL) return NotFound();
        return Ok("Listings updated successfully");
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await _listings.DeleteListings(id);
        if (!success) return NotFound();
        return NoContent();
    }

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