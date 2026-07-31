using System;
using System.Threading.Tasks;
using Api.Tests.Integration;
using Microsoft.EntityFrameworkCore;
using Modules.Reviews.Models;
using Modules.Transactions.Models;
using Npgsql;
using Xunit;

namespace UniTrade.Tests.Integration.Constraints;

[Trait("Category", "Integration")]
[Collection("DatabaseCollection")]
public sealed class ReviewUniquenessTests
{
    private readonly DbFixture _fixture;

    public ReviewUniquenessTests(DbFixture fixture) => _fixture = fixture;

    [Fact]
    public async Task AttemptSecondReview_SameReviewerAndOneTransaction_IsRejected()
    {
        var transactionId = await SeedTransactionFromReservationAsync();

        await using (var db = _fixture.CreateContext())
        {
            db.Reviews.Add(
                AReview(
                    transactionId,
                    reviewerId: _fixture.BuyerId,
                    revieweeId: _fixture.SellerId,
                    "buyer_to_seller",
                    rating: 4
                )
            );

            await db.SaveChangesAsync();
        }
        await using (var db = _fixture.CreateContext())
        {
            db.Reviews.Add(
                AReview(
                    transactionId,
                    reviewerId: _fixture.BuyerId,
                    revieweeId: _fixture.SellerId,
                    "buyer_to_seller",
                    rating: 4
                )
            );
            var exception = await Assert.ThrowsAnyAsync<DbUpdateException>(() =>
                db.SaveChangesAsync()
            );
            var postgres = Assert.IsType<PostgresException>(exception.InnerException);
            Assert.Equal("23505", postgres.SqlState);
            Assert.Equal("review_per_transaction", postgres.ConstraintName);
        }
    }

    [Fact]
    public async Task ParticipatingParties_OnSameTransaction_AreBothAllowedToReviewEachOther()
    {
        var transactionId = await SeedTransactionFromReservationAsync();

        await using (var db = _fixture.CreateContext())
        {
            db.Reviews.Add(
                AReview(
                    transactionId,
                    reviewerId: _fixture.BuyerId,
                    revieweeId: _fixture.SellerId,
                    "buyer_to_seller",
                    rating: 4
                )
            );

            await db.SaveChangesAsync();
        }

        await using (var db = _fixture.CreateContext())
        {
            db.Reviews.Add(
                AReview(
                    transactionId,
                    reviewerId: _fixture.SellerId,
                    revieweeId: _fixture.BuyerId,
                    "seller_to_buyer",
                    rating: 3
                )
            );

            await db.SaveChangesAsync();
        }

        await using (var verify = _fixture.CreateContext())
        {
            var cnt = await verify.Reviews.CountAsync(r => r.TransactionId == transactionId);
            Assert.Equal(2, cnt);
        }
    }

    private async Task<Guid> SeedTransactionFromReservationAsync()
    {
        await using var db = _fixture.CreateContext();
        var txn = new Transaction
        {
            TransactionId = Guid.NewGuid(),
            ReservationId = _fixture.ReservationId,
            SellerId = _fixture.SellerId,
            BuyerId = _fixture.BuyerId,
            Amount = 100m,
            PinStatus = "confirmed",
        };
        db.Transactions.Add(txn);
        await db.SaveChangesAsync();
        return txn.TransactionId;
    }

    private static Review AReview(
        Guid txId,
        Guid reviewerId,
        Guid revieweeId,
        string reviewType,
        int rating = 5
    ) =>
        new()
        {
            TransactionId = txId,
            RevieweeId = revieweeId,
            ReviewerId = reviewerId,
            ReviewType = reviewType,
            Rating = rating,
        };
}
