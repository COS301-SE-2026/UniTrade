using Microsoft.AspNetCore.Mvc;
using Modules.Disputes.Models.Dto;
using Modules.Identity.Models.Dto;
using Modules.Identity.Repositories;
using Modules.Listings;
using Modules.Listings.Models.Dto;
using Modules.Reputation.Repositories;
using Modules.Reviews.Repositories;

namespace Api.Controllers;

[Route("api/admin/users")]
public sealed class AdminUsersController : AdminControllerBase
{
    private readonly IListingService _listings;
    private readonly IReviewRepository _reviews;
    private readonly IStrikeRepository _strikes;
    private readonly IUserRepository _users;

    public AdminUsersController(
        IListingService listings,
        IReviewRepository reviews,
        IStrikeRepository strikes,
        IUserRepository users
    )
    {
        _listings = listings;
        _users = users;
        _reviews = reviews;
        _strikes = strikes;
    }

    [HttpGet("{userId:guid}/listings")]
    public async Task<ActionResult<IEnumerable<UserListingDto>>> GetUserListings(
        Guid userId,
        [FromQuery] int limit = 10,
        CancellationToken ct = default
    )
    {
        limit = Math.Clamp(limit, 1, 50);
        var page = await _listings.ListAsync(
            new ListFilterDto
            {
                SellerId = userId,
                Take = limit,
                Skip = 0,
            }
        );
        return Ok(
            page.Items.Select(l => new UserListingDto
            {
                ListingId = l.ListingId,
                Title = l.Title,
                Status = l.ListingStatus,
                Price = l.Price,
                CreatedAt = l.CreatedAt,
                ImageUrl = l.Images.FirstOrDefault() is { } img
                    ? $"/api/listings/{l.ListingId}/images/{img.ImageId}"
                    : null,
            })
        );
    }

    [HttpGet]
    public async Task<ActionResult<ListUsersResponseDto>> List(
        [FromQuery] string? verificationStatus = null,
        [FromQuery] bool? hasStrikes = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        CancellationToken ct = default
    )
    {
        limit = Math.Clamp(limit, 1, 100);
        page = Math.Max(1, page);
        var skip = (page - 1) * limit;

        var users = await _users.ListAsync(verificationStatus, hasStrikes, search, skip, limit, ct);
        var total = await _users.CountAsync(verificationStatus, hasStrikes, search, ct);

        var items = new List<UserListItemDto>();
        foreach (var user in users)
        {
            var reviews = await _reviews.GetForUserAsync(user.UserId, ct);
            var avg = reviews.Any() ? reviews.Average(r => r.Rating) : 0;
            var strikeCount = await _strikes.CountForUserAsync(user.UserId, ct);

            items.Add(
                new UserListItemDto
                {
                    UserId = user.UserId,
                    Name = $"{user.FirstName} {user.LastName}",
                    Email = user.Email,
                    Degree = user.StudentProfile?.DegreeProgram ?? "N/A",
                    Year = user.StudentProfile?.YearOfStudy ?? 0,
                    VerificationStatus = user.StudentProfile?.VerificationStatus ?? "pending",
                    ReviewAverage = avg,
                    StrikeCount = strikeCount,
                }
            );
        }

        return Ok(new ListUsersResponseDto { Users = items, Total = total });
    }
}
