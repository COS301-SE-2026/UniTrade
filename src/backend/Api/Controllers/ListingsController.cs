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
    private readonly IImageStorageService _images;

    public ListingController(IListingService listings, IImageStorageService images)
    {
        _listings = listings;
        _images = images;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateListingDto request)
    {
        if (string.IsNullOrEmpty(request.Title) || string.IsNullOrEmpty(request.Condition) || request.Price <= 0)
            return BadRequest("Field(s) missing.");

        var response = await _listings.CreateListings(request);
        return Ok(response);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update([FromBody] UpdateListingDto request, Guid id)
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

    [HttpPost("{listingId:guid}/images")]
    public async Task<IActionResult> UploadImages(Guid listingId, [FromForm] List<IFormFile> files, CancellationToken ct)
    {
        if (files is null || files.Count == 0)
            return BadRequest("no_files");

        const long maxBytes = 10 * 1024 * 1024;
        string[] allowed = ["image/jpeg", "image/png", "image/webp"];

        var imageIds = new List<int>();
        foreach (var file in files)
        {
            if (file.Length == 0 || file.Length > maxBytes) return BadRequest("file_too_large");
            if (!allowed.Contains(file.ContentType)) return BadRequest("invalid_file_type");

            using var stream = new MemoryStream();
            await file.CopyToAsync(stream, ct);

            var id = await _images.UploadAsync(listingId, stream.ToArray(), file.ContentType, isPrimary: false, ct);
            imageIds.Add(id);
        }

        return Ok(new { imageIds });
    }
}