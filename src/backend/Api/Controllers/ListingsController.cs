using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Modules.Listings;
using Modules.Listings.Models.Dto;
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

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateListingDto request)
    {
        if (
            string.IsNullOrEmpty(request.Title)
            || string.IsNullOrEmpty(request.Condition)
            || request.Price <= 0
        )
            return BadRequest("Field(s) missing.");

        var callerIdClaim =
            User.FindFirstValue("sub") ?? (User.FindFirstValue(ClaimTypes.NameIdentifier));
        if (!Guid.TryParse(callerIdClaim, out var callerId))
        {
            return Unauthorized(new { error = "unauthenticated" });
        }
        var response = await _listings.CreateListings(request, callerId);
        return Ok(response);
    }

    [Authorize]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        [FromBody] UpdateListingDto request,
        Guid id,
        CancellationToken ct
    )
    {
        var callerIdClaim =
            User.FindFirstValue("sub") ?? (User.FindFirstValue(ClaimTypes.NameIdentifier));
        if (!Guid.TryParse(callerIdClaim, out var callerId))
        {
            return Unauthorized(new { error = "unauthenticated" });
        }

        var updateL = await _listings.UpdateListings(request, id, callerId, ct);
        if (!updateL)
            return NotFound();
        return Ok("Listings updated successfully");
    }


    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] ListFilterDto filter)
    {
        var result = await _listings.ListAsync(filter);
        return Ok(result);
    }

    [Authorize]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var listing = await _listings.GetByIdAsync(id);
        if (listing == null)
            return NotFound(new { error = "listing_not_found" });
        return Ok(listing);
    }

    [Authorize]
    [HttpPost("{listingId:guid}/images")]
    public async Task<IActionResult> UploadImages(
        Guid listingId,
        [FromForm] List<IFormFile> files,
        CancellationToken ct
    )
    {
        if (files is null || files.Count == 0)
            return BadRequest("no_files");

        var callerIdClaim =
            User.FindFirstValue("sub") ?? (User.FindFirstValue(ClaimTypes.NameIdentifier));
        if (!Guid.TryParse(callerIdClaim, out var callerId))
        {
            return Unauthorized(new { error = "unauthenticated" });
        }

        if (!await _listings.IsOwnerAsync(listingId, callerId))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = "forbidden" });
        }

        const long maxBytes = 10 * 1024 * 1024;
        string[] allowed = new string[] { "image/jpeg", "image/png", "image/webp" };

        var imageIds = new List<int>();
        foreach (var file in files)
        {
            if (file.Length == 0 || file.Length > maxBytes)
                return BadRequest("file_too_large");
            if (!allowed.Contains(file.ContentType))
                return BadRequest("invalid_file_type");

            using var stream = new MemoryStream();
            await file.CopyToAsync(stream, ct);

            var id = await _images.UploadAsync(
                listingId,
                stream.ToArray(),
                file.ContentType,
                false,
                ct
            );
            imageIds.Add(id);
        }

        return Ok(new { imageIds });
    }

    [Authorize]
    [HttpGet("{listingId:guid}/images/{imageId:int}")]
    public async Task<IActionResult> GetImage(Guid listingId, int imageId, CancellationToken ct)
    {
        var res = await _images.GetAsync(imageId, ct);

        if (res is null)
        {
            return NotFound();
        }

        var (data, contentType) = res.Value;

        var etag =
            "\""
            + Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(data))[..16]
            + "\"";

        if (Request.Headers.IfNoneMatch == etag)
        {
            return StatusCode(StatusCodes.Status304NotModified);
        }

        Response.Headers.CacheControl = "private, max-age=86400";
        Response.Headers.ETag = etag;

        return File(data, contentType);
    }
    [Authorize]
    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusRequest request, CancellationToken ct)
    {
        var callerIdClaim =
           User.FindFirstValue("sub") ?? (User.FindFirstValue(ClaimTypes.NameIdentifier));
        if (!Guid.TryParse(callerIdClaim, out var callerId))
        {
            return Unauthorized(new { error = "unauthenticated" });
        }

        try
        {
            var updated = await _listings.UpdateStatusAsync(id, callerId, request.Status, ct);
            return updated ? Ok(new { status = request.Status }) : NotFound(new { error = "listing_not_found" });

        }
        catch (ArgumentException ex) when (ex.Message == "invalid_status")
        {
            return BadRequest(new { error = "invalid_status" });

        }

        catch (UnauthorizedAccessException)
        {
            return StatusCode(403, new { error = "forbidden" });

        }

        catch (InvalidOperationException ex) when (ex.Message == "status_locked")
        {
            return Conflict(new { error = "status_locked" });

        }
    }

    public record UpdateStatusRequest(string Status);
}
