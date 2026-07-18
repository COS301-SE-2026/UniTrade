namespace Modules.Reviews.Models.Dto;

public record CreateReviewRequest(Guid TransactionId, int Rating, string? Comment);

public record ReviewDto(
    int ReviewId,
    Guid TransactionId,
    Guid ReviewerId,
    Guid RevieweeId,
    string ReviewType,
    int Rating,
    string? Comment,
    DateTime CreatedAt
);

public record UserReviewDto(
    Guid UserId,
    decimal SellerScore, // to be used as the avg of buyer_to_seller reviews
    decimal BuyerScore,
    IReadOnlyList<ReviewDto> Reviews
);
