using Microsoft.AspNetCore.Mvc;
using Modules.Listings;
using Modules.Listings.Models.Dto;
using Modules.Listings.Models;
using Modules.SharedKernel;
namespace Api.Controllers;

[ApiController]
[Route("api/listings")]
public class ListingController : ControllerBase
{
    private readonly IListingService _listings;
    private readonly IBlobStorageService _blob;


    public ListingController(IListingService listings, IBlobStorageService blob)
    {
        _listings = listings;
        _blob = blob;
    }

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

    [HttpPost("images")]
    public async Task<IActionResult> UploadImages([FromForm] List<IFormFile> files)
    {
        if (files is null || files.Count == 0)
            return BadRequest("no_files");

        const long maxBytes = 10 * 1024 * 1024;//10 mb is max 
        string[] allowed = ["image/jpeg", "image/png", "image/webp"];

        var urls = new List<string>();
        foreach (var file in files)
        {
            if (file.Length == 0 || file.Length > maxBytes) return BadRequest("file_too_large");
            if (!allowed.Contains(file.ContentType)) return BadRequest("invalid_file_type");

            await using var stream = file.OpenReadStream();
            urls.Add(await _blob.UploadAsync(stream, file.FileName, file.ContentType));
        }

        return Ok(new { urls });
    }
}