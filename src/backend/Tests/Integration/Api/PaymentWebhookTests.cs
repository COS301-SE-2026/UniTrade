using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Api.Tests.Fixtures;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Modules.Identity.Models;
using Modules.Listings.Models;
using Modules.Reservations.Models;
using Modules.Reservations.StateMachine;
using Xunit;

[Trait("Category", "Integration")]
public sealed class PaymentWebhookTests : IClassFixture<AdminApiFactory>
{
    private readonly AdminApiFactory _factory;

    public PaymentWebhookTests(AdminApiFactory factory) => _factory = factory;

    private HttpClient NewClient() =>
        _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = true });

    // QR-03b Forged/tampered payment callback has no effect
    [Fact]
    public async Task TamperedPaymentNotification_IsRejected_NoStateChange()
    {
        var (reservationId, _, _) = await SeedReservationAsync();

        var validPayload = BuildValidPayFastPayload(reservationId, price: 100.00m);
        var tamperedPayload = new FormUrlEncodedContent(
            validPayload.ToDictionary(kv => kv.Key, kv => kv.Key == "amount" ? "200.00" : kv.Value)
        );

        var client = NewClient();

        var response = await client.PostAsync("/api/reservations/itn", tamperedPayload);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        await using var db = _factory.NewContext();
        var tx = await db.Transactions.FirstOrDefaultAsync(t => t.ReservationId == reservationId);
        Assert.Null(tx);
    }

    private async Task<(Guid reservationId, Guid sellerId, Guid buyerId)> SeedReservationAsync()
    {
        await using var db = _factory.NewContext();

        var sellerId = Guid.NewGuid();
        var buyerId = Guid.NewGuid();
        db.Users.AddRange(
            new User
            {
                UserId = sellerId,
                FirstName = "Seller named",
                LastName = "For NFR tests",
                Email = $"seller-{sellerId:N}@uni.ac.za",
                PhoneNumber = "",

                Role = "student",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("CorrectPassword123!"),
            },
            new User
            {
                UserId = buyerId,
                FirstName = "buyer named",
                LastName = "For NFR tests",
                Email = $"buyer-{sellerId:N}@uni.ac.za",
                PhoneNumber = "",

                Role = "student",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("CorrectPassword123!"),
            }
        );
        var listing = new Listing
        {
            Title = "dto.Title",
            Description = "dto.Description",
            Price = 100.00m,
            CategoryId = 1,
            Condition = "good",
            SellerId = sellerId,
            ListingStatus = "live",
            ListingId = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        db.Listings.Add(listing);

        var reservation = new Reservation
        {
            SellerId = sellerId,
            BuyerId = buyerId,
            ReservationStatus = ReservationState.Active,
            ReservationId = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(1),
        };
        db.Reservations.Add(reservation);

        db.ReservationListings.Add(
            new ReservationListing
            {
                ReservationId = reservation.ReservationId,
                ListingId = listing.ListingId,
            }
        );
        await db.SaveChangesAsync();

        return (reservation.ReservationId, sellerId, buyerId);
    }

    private static Dictionary<string, string> BuildValidPayFastPayload(
        Guid reservationId,
        decimal price
    )
    {
        const string merchantKey = "46f9cd694581a";
        const string merchantId = "10000100";
        const string passphrase = "verymuchexistentpassphrase";

        var fields = new List<KeyValuePair<string, string>>
        {
            new("merchant_id", merchantId),
            new("merchant_key", merchantKey),
            new("return_url", $"http://localhost/return"),
            new("cancel_url", $"http://localhost/cancel"),
            new("notify_url", $"http://localhost/notify"),
            new("name_first", "buyerFirstName"),
            new("name_last", ""),
            new("email_address", "buyerEmail@gmail.com"),
            new("m_payment_id", reservationId.ToString()),
            new("amount", price.ToString("F2", CultureInfo.InvariantCulture)),
            new("item_name", "Testing thing item"),
        };
        var sb = new StringBuilder();

        foreach (var (key, value) in fields)
        {
            sb.Append($"{key}={PayFastEncode(value)}&");
        }

        if (!string.IsNullOrEmpty(passphrase))
        {
            sb.Append($"passphrase={PayFastEncode(passphrase)}");
        }
        else
        {
            sb.Length -= 1; // why is this wrong-->-1 is invalid cause it throws an out of range exception
        }
        var baseString = sb.ToString();

        using var md5 = MD5.Create();
        var hash = md5.ComputeHash(Encoding.UTF8.GetBytes(sb.ToString()));

        var signature = Convert.ToHexString(hash).ToLowerInvariant();

        var dict = fields.ToDictionary(kv => kv.Key, kv => kv.Value);
        dict["signature"] = signature;
        return dict;
    }

    private static string PayFastEncode(string value)
    {
        return Uri.EscapeDataString(value ?? string.Empty);
    }
}
