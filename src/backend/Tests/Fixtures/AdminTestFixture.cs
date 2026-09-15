using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Api.Tests.Fixtures;

public class AdminTestFixture : IAsyncLifetime
{
    private readonly WebApplicationFactory<Program> _factory;
    private HttpClient? _client;

    public AdminTestFixture(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    public HttpClient Client => _client ?? throw new InvalidCastException("Client not initialised");

    public async Task InitializeAsync()
    {
        _client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            HandleCookies = true,
        });

        var adminResponse = await _client.PostAsync("/api/dev/admin", null);
        adminResponse.EnsureSuccessStatusCode();
        var adminCreds = await adminResponse.Content.ReadFromJsonAsync<AdminCredentials>();

        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new { adminCreds!.Email, adminCreds.Password });
        loginResponse.EnsureSuccessStatusCode();

    }

    public async Task DisposeAsync()
    {
        _client?.Dispose();
        await Task.CompletedTask;
    }

    private record AdminCredentials(string Email, string Password);

}
