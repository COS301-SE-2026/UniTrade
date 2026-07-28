using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Modules.ReferenceData.University;
using Modules.ReferenceData.University.Repositories;
using Moq;
using Xunit;

namespace UniTrade.Tests.Unit.Modules;

[Trait("Category", "Unit")]
public class UniversityServiceTests
{
    private readonly Mock<IUniversityRepository> _universityRepositoryMock;
    private readonly UniversityService _sut;

    public UniversityServiceTests()
    {
        _universityRepositoryMock = new Mock<IUniversityRepository>();
        _sut = new UniversityService(_universityRepositoryMock.Object);
    }

    //GetActiveUniversitiesAsync
    [Fact]
    public async Task GetActiveUniversitiesAsync_ReturnsMappedUniversities_WhenActiveExist()
    {
        var universities = new List<University>
        {
            new University
            {
                UniversityId = 2,
                Name = "University of Pretoria",
                EmailDomains = new List<UniversityEmailDomain>
                {
                    new() { EmailDomain = "tuks.co.za", IsActive = true },
                },
                IsActive = true,
            },
        };
        _universityRepositoryMock.Setup(r => r.GetActiveAsync()).ReturnsAsync(universities);

        var result = await _sut.GetActiveUniversitiesAsync();

        Assert.NotNull(result);
        Assert.Single(result);
        Assert.Equal("tuks.co.za", (IAsyncEnumerable<char>?)result[0].Email_domains);
        Assert.True(result[0].Is_Active);
    }

    [Fact]
    public async Task GetActiveUniversitiesAsync_ReturnsEmptyList_WhenNoActiveUniversities()
    {
        _universityRepositoryMock
            .Setup(r => r.GetActiveAsync())
            .ReturnsAsync(new List<University>());

        var result = await _sut.GetActiveUniversitiesAsync();

        Assert.NotNull(result);
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetActiveUniversitiesAsync_CallsRepositoryOnce()
    {
        _universityRepositoryMock
            .Setup(r => r.GetActiveAsync())
            .ReturnsAsync(new List<University>());

        await _sut.GetActiveUniversitiesAsync();
        _universityRepositoryMock.Verify(r => r.GetActiveAsync(), Times.Once);
    }

    [Fact]
    public async Task GetActiveUniversitiesAsync_ThrowsException_WhenRepositoryThrows()
    {
        _universityRepositoryMock
            .Setup(r => r.GetActiveAsync())
            .ThrowsAsync(new Exception("DB error"));

        await Assert.ThrowsAsync<Exception>(() => _sut.GetActiveUniversitiesAsync());
    }
}
