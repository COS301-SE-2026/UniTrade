using dotenv.net;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;


DotEnv.Load(options: new DotEnvOptions(
    envFilePaths: new[] { Path.Combine(Directory.GetCurrentDirectory(), "../.env") }
));

var builder = WebApplication.CreateBuilder(args);

// configs 
builder.Configuration.AddEnvironmentVariables();

// db context 
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlServer(
        builder.Configuration["ConnectionStrings:Connection"]
    );
});


// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// -- Test DB Connection
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    try
    {
        var canConnect = db.Database.CanConnect();
        Console.WriteLine(canConnect ? "Database connection successful" : "MEHHHH");

    }

    catch (Exception ex)
    {
        Console.WriteLine($"DB ERROR: {ex.Message}");
    }
}
// Configure middleware pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();