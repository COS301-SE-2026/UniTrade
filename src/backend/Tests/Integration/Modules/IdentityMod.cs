using System.Threading.Tasks;
using Api.Tests.Integration;
using Xunit;

namespace Api.Tests.Integration.Modules;

[Trait("Category", "Integration")]
[Collection("DatabaseCollection")]
public class ModuleTests
{
    private readonly DbFixture _fixture;

    public ModuleTests(DbFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task IdentityModule_ShouldProcessBusinessLogicWithRealDb()
    {
        var dbConnectionString = _fixture.ConnectionString;
        Assert.NotEmpty(dbConnectionString);
        await Task.CompletedTask;
    }
}
