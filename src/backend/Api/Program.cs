using System.Text;
using System.Threading.RateLimiting;
using Api;
using Api.BackgroundServices;
using Api.Hubs;
using Api.Middleware;
using Api.Notifiers;
using Azure.Communication.Email;
using dotenv.net;
using Infrastructure.Notifications;
using Infrastructure.Persistence;
using Infrastructure.Persistence.Repositories;
using Infrastructure.Persistence.Repositories.Chat;
using Infrastructure.Persistence.Repositories.Courses;
using Infrastructure.Persistence.Repositories.ListingImages;
using Infrastructure.Persistence.Repositories.Listings;
using Infrastructure.Persistence.Repositories.Reservations;
using Infrastructure.Persistence.Repositories.Reviews;
using Infrastructure.Persistence.Repositories.Transactions;
using Infrastructure.Realtime;
using Infrastructure.Storage;
using Infrastructure.Transactions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Modules.Chat;
using Modules.Chat.Repository;
using Modules.Identity;
using Modules.Identity.Repositories;
using Modules.Identity.Verification;
using Modules.Listings;
using Modules.Listings.Repositories;
using Modules.Notifications;
using Modules.Notifications.Repositories;
using Modules.ReferenceData;
using Modules.ReferenceData.Course;
using Modules.ReferenceData.Course.Repositories;
using Modules.ReferenceData.University;
using Modules.ReferenceData.University.Repositories;
using Modules.Reservations;
using Modules.Reservations.Repositories;
using Modules.Reviews;
using Modules.Reviews.Repositories;
using Modules.SharedKernel;
using Modules.Transactions;
using Modules.Transactions.Repositories;
using Modules.Wishlist;
using Modules.Wishlist.Repositories;

DotEnv.Load(
    options: new DotEnvOptions(
        envFilePaths: new[] { Path.Combine(Directory.GetCurrentDirectory(), "../.env") }
    )
);

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddEnvironmentVariables();

const string UnknownKey = "unknown";

//rate limiters

builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy(
        "register",
        httpContext =>
            RateLimitPartition.GetFixedWindowLimiter(
                httpContext.Connection.RemoteIpAddress?.ToString() ?? UnknownKey,
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 5,
                    Window = TimeSpan.FromHours(1),
                    QueueLimit = 0,
                }
            )
    );

    options.AddPolicy(
        "login",
        httpContext =>
            RateLimitPartition.GetFixedWindowLimiter(
                httpContext.Connection.RemoteIpAddress?.ToString() ?? UnknownKey,
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 10,
                    Window = TimeSpan.FromMinutes(15),
                    QueueLimit = 0,
                }
            )
    );

    options.AddPolicy(
        "verify-otp",
        httpContext =>
            RateLimitPartition.GetFixedWindowLimiter(
                httpContext.Connection.RemoteIpAddress?.ToString() ?? UnknownKey,
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 5,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0,
                }
            )
    );

    options.AddPolicy(
        "resend-otp",
        httpContext =>
            RateLimitPartition.GetFixedWindowLimiter(
                httpContext.Connection.RemoteIpAddress?.ToString() ?? UnknownKey,
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 5,
                    Window = TimeSpan.FromMinutes(15),
                    QueueLimit = 0,
                }
            )
    );

    options.RejectionStatusCode = 429;
});

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options
        .UseNpgsql(builder.Configuration["ConnectionStrings:DefaultConnection"])
        .UseSnakeCaseNamingConvention();
});

builder.Services.Configure<JsonOptions>(options =>
{
    options.SerializerOptions.PropertyNameCaseInsensitive = true;
});

builder.Services.AddControllers();

var allowedOrigins =
    builder
        .Configuration["Cors:AllowedOrigins"]
        ?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? new[] { "http://localhost:3000", "http://localhost:8080" };

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowReactApp",
        policy =>
        {
            policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod().AllowCredentials();
        }
    );
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddSignalR();

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IVerificationRepository, VerificationRepository>();
builder.Services.AddScoped<IIdentityService, IdentityService>();
builder.Services.AddScoped<IUniversityRepository, UniversityRepository>();
builder.Services.AddScoped<IUniversityService, UniversityService>();
builder.Services.AddScoped<IVerificationService, VerificationService>();
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddScoped<AcsEmailService>();
    builder.Services.AddScoped<IEmailService, TestEmailService>();
}
else
{
    builder.Services.AddScoped<IEmailService, AcsEmailService>();
}
builder.Services.AddScoped<IListingService, ListingService>();
builder.Services.AddScoped<IListingRepository, ListingRepository>();
builder.Services.AddScoped<IListingImageRepository, ListingImageRepository>();
builder.Services.AddScoped<IImageStorageService, PostgresImageStorageService>();
builder.Services.AddScoped<ICourseService, CourseService>();
builder.Services.AddScoped<ICourseRepository, CourseRepository>();
builder.Services.AddScoped<IReservationService, ReservationService>();
builder.Services.AddScoped<IReservationRepository, ReservationRepository>();
builder.Services.AddScoped<IReservationMembership, ReservationRepository>();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddHostedService<ReservationExpiryWorker>();
builder.Services.AddScoped<INotificationDispatcher, NotificationDispatcher>();
builder.Services.AddScoped<IChatRepository, ChatRepository>();
builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddScoped<IBroadCastService, BroadCastService>();
builder.Services.AddScoped<IReservationRealTime, ReservationRealTimeService>();
builder.Services.AddScoped<IWishlistRepository, WishlistRepository>();
builder.Services.AddScoped<IWishlistService, WishlistService>();
builder.Services.AddScoped<ITransactionsService, TransactionService>();
builder.Services.AddScoped<ITransactionRepository, TransactionRepository>();
builder.Services.AddScoped<IMeetupService, MeetupService>();
builder.Services.AddScoped<IMeetupRepository, MeetupRepository>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<IReviewRepository, ReviewRepository>();
builder.Services.AddScoped<IChatNotifier, SignalRChatNotifier>();
builder.Services.AddScoped<IListingNotifier, ListingNotifier>();
builder.Services.AddSingleton<IUserIdProvider, SubUserIdProvider>();
builder.Services.AddSingleton<ConnectionTracker>();
builder.Services.AddScoped<IDeviceTokenRepository, DeviceTokenRepository>();
builder.Services.AddScoped<IFcmPushService, FcmPushService>();
builder.Services.AddScoped<IPaymentGateway, PayFastPaymentGateway>();

builder.Services.AddSingleton(
    new EmailClient(
        builder.Configuration["Acs:ConnectionString"]
            ?? throw new InvalidOperationException("Acs:ConnectionString is not configured")
    )
);
var jwtSecret =
    builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("JWT_SECRET is not configured");
var key = Encoding.UTF8.GetBytes(jwtSecret);

builder
    .Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateLifetime = true,
            ValidateIssuer = false,
            ValidateAudience = false,
        };

        options.Events = AuthEventsFactory.CreateJwtEvents();
    });

var app = builder.Build();

app.Use(
    async (context, next) =>
    {
        if (context.Request.Path.StartsWithSegments("/api/reservations/itn"))
            context.Request.EnableBuffering();
        await next();
    }
);

FirebaseInitializer.Initialize(
    app.Configuration,
    app.Environment,
    app.Services.GetRequiredService<ILogger<Program>>()
);
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHsts();
}

app.UseForwardedHeaders();

app.UseRouting();
app.UseCors("AllowReactApp");
app.UseRateLimiter();
app.UseMiddleware<ExceptionMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.MapGet("/health", () => Results.Ok("healthy"));
app.MapHub<ChatHub>("/chathub");
app.MapControllers();

await app.RunAsync();
