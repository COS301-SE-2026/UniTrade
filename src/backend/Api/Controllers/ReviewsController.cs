using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Modules.Reviews;
using Modules.Reviews.Models.Dto;

namespace Api.Controllers;

[ApiController]
[Route("api/reviews")]
[Authorize]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService _reviews;

    public ReviewsController(IReviewService reviews)
    {
        _reviews = reviews;
    }

    private Guid CallerId => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    // POST /api/reviews
    [HttpPost]
    public async Task<IActionResult> Add(
        [FromBody] CreateReviewRequest request,
        CancellationToken ct
    )
    {
        try
        {
            return Ok(await _reviews.CreateAsync(CallerId, request, ct));
        }
        catch (ReviewException ex)
        {
            return MapError(ex);
        }
    }

    // GET /api/reviews/users/{userId}
    [HttpGet("users/{userId:guid}")]
    public async Task<IActionResult> GetForUser(Guid userId, CancellationToken ct)
    {
        return Ok(await _reviews.GetForUserAsync(userId, ct));
    }

    private ObjectResult MapError(ReviewException ex) =>
        ex.Message switch
        {
            ReviewErrors.TransactionNotFound => NotFound(new { error = ex.Message }),
            ReviewErrors.TransactionNotComplete => Conflict(new { error = ex.Message }),
            ReviewErrors.AlreadyReviewed => Conflict(new { error = ex.Message }),
            ReviewErrors.NotAParty => StatusCode(403, new { error = ex.Message }),
            ReviewErrors.SelfReview => StatusCode(403, new { error = ex.Message }),
            ReviewErrors.InvalidRating => BadRequest(new { error = ex.Message }),
            _ => StatusCode(500, new { error = "server_error" }),
        };

}
