using Api.Middleware;
using dotenv.net;
using Infrastructure.Notifications;
using Infrastructure.Persistence;
using Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using Modules.Identity;
using Modules.Identity.Repositories;
using Modules.Identity.Verification;
using Modules.Notifications;
using Modules.ReferenceData.University;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.Text;

DotEnv.Load(options: new DotEnvOptions(
    envFilePaths: new[] { Path.Combine(Directory.GetCurrentDirectory(), "../.env") }
));

var builder = WebApplication.CreateBuilder(args);

// configs 
builder.Configuration.AddEnvironmentVariables();

// db context 
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options
        .UseSqlServer(builder.Configuration["ConnectionStrings:Connection"]);

});



// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IVerificationRepository, VerificationRepository>();

builder.Services.AddScoped<IIdentityService, IdentityService>();
builder.Services.AddScoped<IUniversityRepository, UniversityRepository>();

builder.Services.AddScoped<IVerificationService, VerificationService>();
builder.Services.AddHttpClient<INotificationsService, ResendEmailService>();

//authentication setup(jwt)
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? throw new InvalidOperationException("JWT_SECRET is not configured");
var key = Encoding.UTF8.GetBytes(jwtSecret);


builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateLifetime = true,
        ValidateIssuer = false,
        ValidateAudience = false
    };

    // read token from cookie

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = ctx =>
        {
            ctx.Token = ctx.Request.Cookies["authToken"];
            return Task.CompletedTask;
        }
    };
});

var app = builder.Build();

// Configure middleware pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHsts();
}
app.UseHttpsRedirection();

app.UseRouting();

app.UseMiddleware<ExceptionMiddleware>();
app.UseMiddleware<AuthMiddleware>();
app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();