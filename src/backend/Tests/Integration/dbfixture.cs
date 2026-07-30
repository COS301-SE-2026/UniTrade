using System;
using System.Threading.Tasks;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Modules.Identity.Models;
using Modules.Listings.Models;
using Modules.Reservations.Models;
using Testcontainers.PostgreSql;
using Xunit;

namespace Api.Tests.Integration;

[Trait("Category", "Integration")]
public sealed class DbFixture : IAsyncLifetime
{
    static DbFixture()
    {
        AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
    }

    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder("postgres:18").Build();

    private string _connectionString = string.Empty;
    public Guid ReservationId { get; private set; }
    public Guid BuyerId { get; private set; }
    public Guid SellerId { get; private set; }

    public AppDbContext CreateContext() =>
        new(
            new DbContextOptionsBuilder<AppDbContext>()
                .UseNpgsql(_connectionString)
                .UseSnakeCaseNamingConvention()
                .Options
        );

    public string ConnectionString => _connectionString;

    public async Task InitializeAsync()
    {
        await _container.StartAsync();
        _connectionString = _container.GetConnectionString();

        await using var db = CreateContext();
        await db.Database.EnsureCreatedAsync();

        var seller = AUser("seller");
        var buyer = AUser("buyer");
        db.Users.AddRange(buyer, seller);

        var reservation = new Reservation
        {
            ReservationId = Guid.NewGuid(),
            BuyerId = buyer.UserId,
            SellerId = seller.UserId,
            IsBundle = false,
            ReservationStatus = "active",
            ExpiresAt = DateTime.UtcNow.AddDays(1),
        };
        db.Reservations.Add(reservation);
        await db.SaveChangesAsync();

        BuyerId = buyer.UserId;
        SellerId = seller.UserId;
        ReservationId = reservation.ReservationId;
    }

    public async Task<Guid> AReservationAsync(string status = "active", bool acknowledged = false)
    {
        await using var db = CreateContext();
        var reservation = new Reservation
        {
            ReservationId = Guid.NewGuid(),
            BuyerId = BuyerId,
            SellerId = SellerId,
            IsBundle = false,
            ReservationStatus = status,
            ExpiresAt = DateTime.UtcNow.AddDays(1),
            SellerAcknowledgedAt = acknowledged ? DateTime.UtcNow : (DateTime?)null,
        };
        db.Reservations.Add(reservation);
        await db.SaveChangesAsync();
        return reservation.ReservationId;
    }

    public async Task<Guid> AListingAsync(
        string status = "live",
        int categoryId = 1,
        int? courseId = null,
        Guid? sellerId = null,
        string title = "Listing book, listed",
        string description = "a well described listing",
        decimal price = 10m,
        DateTime? createdAt = null
    )
    {
        await using var db = CreateContext();
        var listing = new Listing
        {
            ListingId = Guid.NewGuid(),
            SellerId = sellerId ?? SellerId,
            CategoryId = categoryId,
            CourseId = courseId,
            Title = title,
            Description = description,
            Price = price,
            Condition = "good",
            ListingStatus = status,
            IsBundle = false,
            ViewCount = 0,
        };

        if (createdAt.HasValue)
        {
            listing.CreatedAt = createdAt.Value;
        }

        db.Listings.Add(listing);
        await db.SaveChangesAsync();
        return listing.ListingId;
    }

    public async Task<Guid> CreateUserAsync(bool deleted = false)
    {
        await using var db = CreateContext();
        var user = AUser("user");
        user.IsDeleted = deleted;
        if (deleted)
        {
            user.DeletedAt = DateTime.UtcNow;
        }
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user.UserId;
    }

    public Task DisposeAsync() => _container.DisposeAsync().AsTask();

    private static User AUser(string tag) =>
        new()
        {
            UserId = Guid.NewGuid(),
            FirstName = tag,
            LastName = "TagTest",
            Email = $"{Guid.NewGuid():N}-{tag}@uni.ac.za",
            PhoneNumber = "",
            PasswordHash = "HMACSHA256",
            Role = "student",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
}
