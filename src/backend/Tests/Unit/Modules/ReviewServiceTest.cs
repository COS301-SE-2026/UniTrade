using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Modules.Reviews;
using Modules.Reviews.Models;
using Modules.Reviews.Models.Dto;
using Modules.Reviews.Repositories;
using Modules.Transactions.Models;
using Modules.Transactions.Repositories;
using Moq;
using Xunit;

namespace UniTrade.Tests.Unit.Modules;

[Trait("Category", "Unit")]
public class ReviewServiceTests
{
    private readonly Mock<IReviewRepository> _reviews = new();
    private readonly Mock<ITransactionRepository> _transactions = new();
    private readonly ReviewService _sut;

    public ReviewServiceTests()
    {
        _sut = new ReviewService(_reviews.Object, _transactions.Object);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(6)]
    [InlineData(-6)]
    [InlineData(600)]
    public async Task CreateAsync_Throws_WhenRatingOutOfRange(int rating)
    {
        var req = new CreateReviewRequest(Guid.NewGuid(), rating, "comment made");

        var exception = await Assert.ThrowsAsync<ReviewException>(() =>
            _sut.CreateAsync(Guid.NewGuid(), req)
        );

        Assert.Equal(ReviewErrors.InvalidRating, exception.Message);
        _transactions.Verify(
            t => t.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never
        );
    }

    [Fact]
    public async Task GetForUserAsync_BuyerToSellerReview_ContributesToSellerRepScore()
    {
        var userId = Guid.NewGuid();
        _reviews
            .Setup(r => r.GetForUserAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Review> { AReview("buyer_to_seller", 4) });

        var result = await _sut.GetForUserAsync(userId);
        Assert.Equal(4m, result.SellerScore!.Value);
        Assert.Null(result.BuyerScore);
    }

    [Fact]
    public async Task GetForUserAsync_SellerToBuyerReview_ContributesToBuyerRepScore()
    {
        var userId = Guid.NewGuid();
        _reviews
            .Setup(r => r.GetForUserAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Review> { AReview("seller_to_buyer", 4) });

        var result = await _sut.GetForUserAsync(userId);
        Assert.Equal(4m, result.BuyerScore!.Value);
        Assert.Null(result.SellerScore);
    }

    [Fact]
    public async Task GetForUserAsync_NoReviews_ScoresAreNull()
    {
        var userId = Guid.NewGuid();
        _reviews
            .Setup(r => r.GetForUserAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Review>());

        var result = await _sut.GetForUserAsync(userId);

        Assert.Null(result.SellerScore);
        Assert.Null(result.BuyerScore);
        Assert.Empty(result.Reviews);
    }

    [Theory]
    [InlineData("pending")]
    [InlineData("failed")]
    [InlineData("")]
    public async Task CreateAsync_Throws_WhenPinStatusNotConfirmed(string pinStatus)
    {
        var buyer = Guid.NewGuid();
        var seller = Guid.NewGuid();
        var transaction = AConfirmedTransaction(buyer, seller);
        transaction.PinStatus = pinStatus;
        _transactions
            .Setup(t => t.GetByIdAsync(transaction.TransactionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(transaction);

        var req = new CreateReviewRequest(transaction.TransactionId, 5, null);

        var exception = await Assert.ThrowsAsync<ReviewException>(() =>
            _sut.CreateAsync(buyer, req)
        );

        Assert.Equal(ReviewErrors.TransactionNotComplete, exception.Message);
        _reviews.Verify(
            r => r.AddAsync(It.IsAny<Review>(), It.IsAny<CancellationToken>()),
            Times.Never
        );
    }

    [Fact]
    public async Task CreateAsync_Throws_WhenCallerIsNotAParty()
    {
        var transaction = AConfirmedTransaction(buyerId: Guid.NewGuid(), sellerId: Guid.NewGuid());
        _transactions
            .Setup(t => t.GetByIdAsync(transaction.TransactionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(transaction);

        var stranger = Guid.NewGuid();
        var req = new CreateReviewRequest(transaction.TransactionId, 4, null);

        var exception = await Assert.ThrowsAsync<ReviewException>(() =>
            _sut.CreateAsync(stranger, req)
        );

        Assert.Equal(ReviewErrors.NotAParty, exception.Message);
    }

    [Fact]
    public async Task CreateAsync_Throws_WhenReviewingSelf()
    {
        var me = Guid.NewGuid();
        var transaction = AConfirmedTransaction(buyerId: me, sellerId: me);
        _transactions
            .Setup(t => t.GetByIdAsync(transaction.TransactionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(transaction);
        var req = new CreateReviewRequest(transaction.TransactionId, 4, null);

        var exception = await Assert.ThrowsAsync<ReviewException>(() => _sut.CreateAsync(me, req));

        Assert.Equal(ReviewErrors.SelfReview, exception.Message);
    }

    private static Transaction AConfirmedTransaction(Guid buyerId, Guid sellerId) =>
        new()
        {
            TransactionId = Guid.NewGuid(),
            BuyerId = buyerId,
            SellerId = sellerId,
            PinStatus = "confirmed",
        };

    private static Review AReview(string reviewType, int rating) =>
        new()
        {
            ReviewId = Random.Shared.Next(1, int.MaxValue),
            TransactionId = Guid.NewGuid(),
            ReviewerId = Guid.NewGuid(),
            RevieweeId = Guid.NewGuid(),
            ReviewType = reviewType,
            Rating = rating,
            CreatedAt = DateTime.UtcNow,
        };
}
