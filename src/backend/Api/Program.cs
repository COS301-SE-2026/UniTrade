using Api.Middleware;
using dotenv.net;
using Infrastructure.Notifications;
using Infrastructure.Persistence;
using Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Modules.Identity;
using Modules.Identity.Repositories;
using Modules.Identity.Verification;
using Modules.Notifications;
using Modules.ReferenceData.University;

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

var app = builder.Build();


// -- Test DB Connection


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

app.UseAuthorization();

app.MapControllers();

app.Run();