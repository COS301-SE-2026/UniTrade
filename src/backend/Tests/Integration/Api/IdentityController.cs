using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using Api.Tests.Integration;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Api.Tests.Integration.Api;

[Trait("Category", "Integration")]
[Collection("DatabaseCollection")]
public class ControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public ControllerTests(WebApplicationFactory<Program> factory, DbFixture fixture)
    {
        _client = factory
            .WithWebHostBuilder(builder =>
            {
                // Point to our running containerized DB
                builder.UseSetting("ConnectionStrings:DefaultConnection", fixture.ConnectionString);
                builder.UseSetting(
                    "Acs:ConnectionString",
                    "endpoint=https://some.communication.azure.com/;accesskey=keyaccess4333"
                );

                builder.UseSetting(
                    "Jwt:Secret",
                    "integration_test_secret_key_that_is_long_enough_12345!!"
                );
            })
            .CreateClient();
    }

    [Fact]
    public async Task RootOrAuthEndpoint_ShouldRespondWithoutThrowingInternalErrors()
    {
        var response = await _client.GetAsync("/api/auth/status-check-or-fallback");
        Assert.NotEqual(HttpStatusCode.InternalServerError, response.StatusCode);
    }
}
