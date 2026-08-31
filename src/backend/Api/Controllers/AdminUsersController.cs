using Microsoft.AspNetCore.Mvc;
using Modules.Disputes.Models.Dto;
using Modules.Listings;
using Modules.Listings.Models.Dto;

namespace Api.Controllers;

[Route("api/admin/users")]
public sealed class AdminUsersController : AdminControllerBase
{
    private readonly IListingService _listings;

    public AdminUsersController(IListingService listings) => _listings = listings;

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
}
