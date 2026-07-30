using System;
using System.Threading.Tasks;
using Api.Tests.Integration;
using Castle.Core.Logging;
using Infrastructure.Persistence;
using Infrastructure.Persistence.Repositories.Chat;
using Infrastructure.Persistence.Repositories.Reservations;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Modules.Chat;
using Modules.Notifications;
using Moq;
using Xunit;

namespace UniTrade.Tests.Integration.Flows;

[Trait("Category", "Integration")]
[Collection("DatabaseCollection")]
public sealed class ChatPostingTests
{
    private readonly DbFixture _fixture;

    public ChatPostingTests(DbFixture fixture) => _fixture = fixture;

    [Fact]
    public async Task SendAsync_NonParty_Throws_AndNoPersistingOccurs()
    {
        var reservationId = await _fixture.AReservationAsync(acknowledged: true);
        var nonCounterParty = Guid.NewGuid();

        await using (var context = _fixture.CreateContext())
        {
            var exception = await Assert.ThrowsAsync<ChatException>(() =>
                AChatService(context).SendAsync(reservationId, nonCounterParty, "hi")
            );
            Assert.Equal(ChatErrors.Forbidden, exception.Message);
        }
        await HelperForAssertingNoMessages(reservationId);
    }

    [Fact]
    public async Task SendAsync_BuyerBeforeAck_Throws_AndPersistsNothing()
    {
        var reservationId = await _fixture.AReservationAsync(acknowledged: false);

        await using (var context = _fixture.CreateContext())
        {
            var exception = await Assert.ThrowsAsync<ChatException>(() =>
                AChatService(context).SendAsync(reservationId, _fixture.BuyerId, "hi")
            );
            Assert.Equal(ChatErrors.BuyerWaitingAck, exception.Message);
        }
        await HelperForAssertingNoMessages(reservationId);
    }

    [Fact]
    public async Task SendAsync_ToCancelledReservation_Throws_AndPersistsNothing()
    {
        var reservationId = await _fixture.AReservationAsync(
            acknowledged: true,
            status: "cancelled"
        );

        await using (var context = _fixture.CreateContext())
        {
            var exception = await Assert.ThrowsAsync<ChatException>(() =>
                AChatService(context).SendAsync(reservationId, _fixture.BuyerId, "hi")
            );
            Assert.Equal(ChatErrors.ReservationCancelled, exception.Message);
        }
        await HelperForAssertingNoMessages(reservationId);
    }

    [Fact]
    public async Task SendAsync_PartyPostsAfterAck_PersistsMessage()
    {
        var reservationId = await _fixture.AReservationAsync(acknowledged: true);

        await using (var context = _fixture.CreateContext())
        {
            var dto = await AChatService(context).SendAsync(reservationId, _fixture.BuyerId, "hi");
            Assert.Equal("hi", dto.Content);
            Assert.Equal(_fixture.BuyerId, dto.SenderId);
            Assert.Equal("text", dto.MessageType);
        }
        await using (var verifying = _fixture.CreateContext())
        {
            var entry = await verifying.ChatMessages.SingleOrDefaultAsync(m =>
                m.ReservationId == reservationId
            );
            Assert.NotNull(entry);
            Assert.Equal(_fixture.BuyerId, entry!.SenderId);
            Assert.Equal("hi", entry.Content);
        }
    }

    private async Task HelperForAssertingNoMessages(Guid reservationId)
    {
        await using var verifying = _fixture.CreateContext();
        Assert.Equal(
            0,
            await verifying.ChatMessages.CountAsync(m => m.ReservationId == reservationId)
        );
    }

    private static ChatService AChatService(AppDbContext context) =>
        new(
            new ChatRepository(context),
            new ReservationRepository(context),
            Mock.Of<IChatNotifier>(),
            Mock.Of<INotificationDispatcher>(),
            NullLogger<ChatService>.Instance
        );
}
