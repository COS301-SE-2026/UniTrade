using System;
using System.Threading.Tasks;
using Api.Tests.Integration;
using Docker.DotNet.Models;
using Microsoft.EntityFrameworkCore;
using Modules.Chat.Models;
using Npgsql;
using Npgsql.EntityFrameworkCore.PostgreSQL.Query.Expressions.Internal;
using Xunit;

namespace UniTrade.Tests.Integration.Constraints;

[Trait("Category", "Integration")]
[Collection("DatabaseCollection")]
public sealed class ChatConstraintTests
{
    private static readonly string[] _messageTypeOrPayloadConstraints =
    {
        "chk_message_type",
        "chk_payload_type",
    };
    private readonly DbFixture _fixture;

    public ChatConstraintTests(DbFixture fixture) => _fixture = fixture;

    [Theory]
    [InlineData("system", true, null, "chk_system_sender")]
    [InlineData("text", false, null, "chk_system_sender")]
    [InlineData("meetup_proposal", true, null, "chk_payload_type")]
    [InlineData("text", true, "{}", "chk_payload_type")]
    public async Task Insert_InvalidChatMessage_ThrowsCheckConstraintViolation(
        string messageType,
        bool hasSender,
        string? payload,
        string expectedConstraint
    )
    {
        await using var db = _fixture.CreateContext();
        db.ChatMessages.Add(
            AChatMessage(messageType, hasSender ? _fixture.BuyerId : (Guid?)null, payload)
        );

        var exception = await Assert.ThrowsAnyAsync<DbUpdateException>(() => db.SaveChangesAsync());

        var postgres = Assert.IsType<PostgresException>(exception.InnerException);
        Assert.Equal("23514", postgres.SqlState);
        Assert.Equal(expectedConstraint, postgres.ConstraintName);
    }

    [Fact]
    public async Task Insert_UnknownMessageType_IsRejectedByCheck()
    {
        await using var db = _fixture.CreateContext();
        db.ChatMessages.Add(AChatMessage("invalid_message", _fixture.BuyerId, payload: null));
        var exception = await Assert.ThrowsAnyAsync<DbUpdateException>(() => db.SaveChangesAsync());
        var postgres = Assert.IsType<PostgresException>(exception.InnerException);
        Assert.Equal("23514", postgres.SqlState);
        Assert.Contains(postgres.ConstraintName, _messageTypeOrPayloadConstraints);
    }

    [Fact]
    public async Task Insert_DuplicateClientKeyUsed_SecondOneIsRejected()
    {
        const string clientKey = "42-is-duplicated";

        await using (var db = _fixture.CreateContext())
        {
            db.ChatMessages.Add(
                AChatMessage("text", _fixture.BuyerId, payload: null, clientKey: clientKey)
            );
            await db.SaveChangesAsync();
        }

        await using (var db = _fixture.CreateContext())
        {
            db.ChatMessages.Add(
                AChatMessage("text", _fixture.BuyerId, payload: null, clientKey: clientKey)
            );

            var exception = await Assert.ThrowsAnyAsync<DbUpdateException>(() =>
                db.SaveChangesAsync()
            );
            var postgres = Assert.IsType<PostgresException>(exception.InnerException);
            Assert.Equal("23505", postgres.SqlState);
            Assert.Equal("uix_chat_client_key", postgres.ConstraintName);
        }
    }

    private ChatMessage AChatMessage(
        string messageType,
        Guid? senderId,
        string? payload,
        string? clientKey = null
    ) =>
        new()
        {
            ReservationId = _fixture.ReservationId,
            SenderId = senderId,
            MessageType = messageType,
            Content = "hello seller/buyer",
            Payload = payload,
            ClientKey = clientKey,
        };
}
