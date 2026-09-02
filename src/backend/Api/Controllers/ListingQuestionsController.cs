using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Modules.ListingQuestions;
using Modules.ListingQuestions.Models.Dto;

namespace Api.Controllers;

[ApiController]
[Route("api/listings/{listingId:guid}/questions")]
[Authorize]
public class ListingQuestionsController : ControllerBase
{
    private readonly IListingQuestionService _service;

    public ListingQuestionsController(IListingQuestionService service) => _service = service;

    private Guid? UserId
    {
        get
        {
            var sub =
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;

            return sub != null ? Guid.Parse(sub) : null;
        }
    }

    [HttpGet]
    public async Task<IActionResult> Get(Guid listingId, CancellationToken ct) =>
        Ok(await _service.GetForListingAsync(listingId, ct));

    [HttpPost]
    public async Task<IActionResult> Ask(
        Guid listingId,
        [FromBody] AskQuestionDto dto,
        CancellationToken ct
    )
    {
        if (UserId is null)
            return Unauthorized();
        try
        {
            var result = await _service.AskAsync(listingId, UserId.Value, dto.QuestionText, ct);
            return Ok(result);
        }
        catch (ListingQuestionException ex)
        {
            return ex.Message switch
            {
                "listing_not_found" => NotFound(new { code = ex.Message }),
                //"listing_not_live" => BadRequest(new { code = ex.Message }), @@@ZEEEEE i commented this out bc its not really needed, its not called anywhere in the service func
                "cannot_question_own_listing" => Forbid(),
                _ => BadRequest(new { code = ex.Message }),
            };
        }
    }

    [HttpPost("/api/listings/questions/{questionId:guid}/answer")]
    public async Task<IActionResult> Answer(
        Guid questionId,
        [FromBody] AnswerQuestionDto dto,
        CancellationToken ct
    )
    {
        if (UserId is null)
            return Unauthorized();
        try
        {
            var result = await _service.AnswerAsync(questionId, UserId.Value, dto.AnswerText, ct);
            return Ok(result);
        }
        catch (ListingQuestionException ex)
        {
            return ex.Message switch
            {
                "question_not_found" => NotFound(new { code = ex.Message }),
                "not_seller" => Forbid(),
                "already_answered" => BadRequest(new { code = ex.Message }),
                _ => BadRequest(new { code = ex.Message }),
            };
        }
    }
}
