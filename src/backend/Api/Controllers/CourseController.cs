using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Modules.ReferenceData.Course;

namespace Api.Controllers;

[ApiController]
[Route("api/courses")]
public class ListingController(ICourseService courses) : ControllerBase
{
    private readonly ICourseService _courses = courses;

    // GET /api/courses?search=COS&universityId=2&limit50
    [Authorize]
    [HttpGet]
    public async Task<IActionResult> Search(
        [FromQuery] string? search,
        [FromQuery] int? universityId,
        [FromQuery] int limit = 20,
        CancellationToken ct = default
    )
    {
        var results = await _courses.SearchAsync(search, universityId, limit, ct);
        return Ok(results);
    }

    [Authorize]
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var course = await _courses.GetByIdAsync(id, ct);

        if (course is null)
        {
            return NotFound(new { error = "course_not_found" });
        }
        return Ok(course);
    }
}
