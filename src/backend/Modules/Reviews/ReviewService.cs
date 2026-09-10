using Modules.Reviews.Models;
using Modules.Reviews.Models.Dto;
using Modules.Reviews.Repositories;
using Modules.Transactions.Repositories;

namespace Modules.Reviews;

public class ReviewService : IReviewService
{
    private readonly IReviewRepository _reviews;
    private readonly ITransactionRepository _transactions;

    public ReviewService(IReviewRepository reviews, ITransactionRepository transactions)
    {
        _reviews = reviews;
        _transactions = transactions;
    }

    public async Task<ReviewDto> CreateAsync(
        Guid callerId,
        CreateReviewRequest request,
        CancellationToken ct = default
    )
    {
        if (request.Rating is < 1 or > 5)
        {
            throw new ReviewException(ReviewErrors.InvalidRating);
        }
        var transaction =
            await _transactions.GetByIdAsync(request.TransactionId, ct)
            ?? throw new ReviewException(ReviewErrors.TransactionNotFound);

        var isSeller = transaction.SellerId == callerId;
        var isBuyer = transaction.BuyerId == callerId;

        if (!isBuyer && !isSeller)
        {
            throw new ReviewException(ReviewErrors.NotAParty);
        }
        var revieweeId = isBuyer ? transaction.SellerId : transaction.BuyerId;
        if (callerId == revieweeId)
        {
            throw new ReviewException(ReviewErrors.SelfReview);
        }
        if (transaction.PinStatus != "confirmed")
        {
            throw new ReviewException(ReviewErrors.TransactionNotComplete);
        }
        if (await _reviews.ExistsAsync(request.TransactionId, callerId, ct))
        {
            throw new ReviewException(ReviewErrors.AlreadyReviewed);
        }
        var typeOfReview = isBuyer ? "buyer_to_seller" : "seller_to_buyer";

        var review = new Review
        {
            TransactionId = request.TransactionId,
            ReviewerId = callerId,
            RevieweeId = revieweeId,
            ReviewType = typeOfReview,
            Rating = request.Rating,
            Comment = request.Comment?.Trim(),
            CreatedAt = DateTime.UtcNow,
        };

        await _reviews.AddAsync(review, ct);
        await _reviews.SaveAsync(ct);

        return MapToDo(review);
    }

    public async Task<UserReviewDto> GetForUserAsync(Guid userId, CancellationToken ct = default)
    {
        var reviews = await _reviews.GetForUserAsync(userId, ct);

        var buyerRevScore = reviews
            .Where(r => r.ReviewType == "seller_to_buyer")
            .Select(r => (decimal?)r.Rating)
            .Average();

        var sellerRevScore = reviews
            .Where(r => r.ReviewType == "buyer_to_seller")
            .Select(r => (decimal?)r.Rating)
            .Average();

        return new UserReviewDto(
            UserId: userId,
            SellerScore: sellerRevScore.HasValue ? Math.Round(sellerRevScore.Value, 2) : null,
            BuyerScore: buyerRevScore.HasValue ? Math.Round(buyerRevScore.Value, 2) : null,
            Reviews: reviews.Select(MapToDo).ToList()
        );
    }

    private static ReviewDto MapToDo(Review r) =>
        new(
            r.ReviewId,
            r.TransactionId,
            r.ReviewerId,
            r.RevieweeId,
            r.ReviewType,
            r.Rating,
            r.Comment,
            r.CreatedAt
        );
}
