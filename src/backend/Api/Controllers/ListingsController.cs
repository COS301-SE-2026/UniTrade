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

    [HttpPost]
        public async Task<IActionResult> Create([FromBody]CreateListingsDto request)
        {
            if(string.IsNullOrEmpty(request.Title)|| string.IsNullOrEmpty(request.Condition)|| request.Price <= 0)
            {
                return BadRequest("Field(s) missing.");
            }

            var response= await _listingsService.CreateListings(request);
            return Ok(response);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update([FromBody] CreateListingsDto request,int id)
        {
            var updateL=await _listingsService.Listing.UpdateAsync;

            if(!updateL){
                return NotFound();
            }
            return Ok("Listings updated successfully");
        }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success=await _listingsService.DeleteAsync(id);

        if(!success){
            return NotFound();
        }

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