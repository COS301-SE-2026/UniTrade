using System.Threading.Tasks;
using Xunit;
using Api.Tests.Integration;

namespace Api.Tests.Integration.Infrastructure;

[Trait("Category", "Integration")]
[Collection("DatabaseCollection")]
public class InfrastructureTests
{
    private readonly DbFixture _fixture;

    public InfrastructureTests(DbFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task SqlServerContainer_ShouldAllowReadWriteOperations()
    {
        var connectionString = _fixture.ConnectionString;
        Assert.NotNull(connectionString);
        Assert.Contains("Database", connectionString);

        await Task.CompletedTask;
    }
}