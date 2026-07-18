using Modules.Reviews.Models.Dto;

namespace Modules.Reviews;

public interface IReviewService
{
    Task<ReviewDto> CreateAsync(
        Guid callerId,
        CreateReviewRequest request,
        CancellationToken ct = default
    );

    Task<UserReviewDto> GetForUserAsync(Guid userId, CancellationToken ct = default);
}
