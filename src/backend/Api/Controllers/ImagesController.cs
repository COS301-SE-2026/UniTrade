using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Modules.SharedKernel;

namespace Api.Controllers;

[ApiController]
[Route("api/images")]
[Authorize]
public class ImagesController : ControllerBase
{
    private readonly IUploadedImageService _uploadedImages;

    public ImagesController(IUploadedImageService uploadedImages) =>
        _uploadedImages = uploadedImages;

    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file provided" });

        await using var stream = file.OpenReadStream();
        using var ms = new MemoryStream();
        await stream.CopyToAsync(ms, ct);
        var data = ms.ToArray();

        var result = await _uploadedImages.UploadAsync(data, file.ContentType, ct);
        if (result is null)
            return StatusCode(500, new { error = "Upload failed" });

        var (imageId, url) = result.Value;
        return Ok(new { imageId, url });
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> Get(int id, CancellationToken ct)
    {
        var image = await _uploadedImages.GetAsync(id, ct);
        if (image is null)
            return NotFound();

        var (data, contentType) = image.Value;
        return File(data, contentType);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _uploadedImages.DeleteAsync(id, ct);
        return NoContent();
    }
}
