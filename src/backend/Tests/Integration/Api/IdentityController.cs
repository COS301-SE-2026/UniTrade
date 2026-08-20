using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Modules.Transactions;
using Modules.Transactions.Models.Dto;
using Xunit;

namespace Api.Tests.Integration.Api;

[Trait("Category", "Integration")]
[Collection("DatabaseCollection")]
public class ControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public ControllerTests(WebApplicationFactory<Program> factory, DbFixture fixture)
    {
        Environment.SetEnvironmentVariable("Firebase:CredentialsJson","");
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

                builder.UseSetting("Firebase:CredentialsJson", "");

                builder.ConfigureServices(services =>
                {
                    var descriptor = services.SingleOrDefault(d =>
                        d.ServiceType == typeof(IPaymentGateway)
                    );
                    if (descriptor != null)
                    {
                        services.Remove(descriptor);
                    }
                    services.AddScoped<IPaymentGateway, StubPaymentGateway>();
                });
            })
            .CreateClient();
    }

    public class StubPaymentGateway : IPaymentGateway
    {
        public TransactionRequestDto CreatePaymentRequest(
            Guid reservationId,
            string listingTitle,
            decimal amount,
            string buyerFirstName,
            string buyerEmail
        )
        {
            return new TransactionRequestDto(
                "https://sandbox.payfast.co.za/eng/process",
                new Dictionary<string, string>
                {
                    ["merchant_id"] = "stub",
                    ["amount"] = amount.ToString("F2"),
                }
            );
        }

        public bool VerifySignature(string rawBody, string receivedSign)
        {
            return true;
        }
    }

    [Fact]
    public async Task RootOrAuthEndpoint_ShouldRespondWithoutThrowingInternalErrors()
    {
        var response = await _client.GetAsync("/api/auth/status-check-or-fallback");
        Assert.NotEqual(HttpStatusCode.InternalServerError, response.StatusCode);
    }
}
