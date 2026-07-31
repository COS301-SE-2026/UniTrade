using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Api.Controllers;
using Microsoft.AspNetCore.Mvc;
using Modules.ReferenceData.University;
using Moq;
using Xunit;
using UniversityDto = Modules.Identity.Models.DTO.University;

namespace UniTrade.Tests.Unit.Api;

[Trait("Category", "Unit")]
public class UniversityControllerTests
{
    private readonly Mock<IUniversityService> _service;
    private readonly UniversityController _sut;
    private readonly JsonSerializerOptions _jsonOptions;

    public UniversityControllerTests()
    {
        _service = new Mock<IUniversityService>();
        _sut = new UniversityController(_service.Object);
        _jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
    }

    [Fact]
    public async Task GetActiveUniversities_ReturnsOk_WithCountAndData_WhenUniverisitiesExist()
    {
        var universities = new List<UniversityDto>
        {
            new()
            {
                University_ID = 2,
                Name = "University of Pretoria",
                Email_domains = new List<string> { "tuks.co.za" },
                Is_Active = true,
            },
            new()
            {
                University_ID = 1,
                Name = "University of Witwatersrand",
                Email_domains = new List<string> { "wits.ac.za" },
                Is_Active = true,
            },
        };

        _service.Setup(s => s.GetActiveUniversitiesAsync()).Returns(Task.FromResult(universities));

        var result = await _sut.GetActiveUniversities();

        var okResult = Assert.IsType<OkObjectResult>(result);
        var json = JsonSerializer.Serialize(okResult.Value);
        var response = JsonSerializer.Deserialize<Wrapper>(json, _jsonOptions);

        Assert.NotNull(response);
        Assert.Equal(2, response.Count);
        Assert.Equal(universities.Count, response.Data.Count);
    }

    [Fact]
    public async Task GetActiveUniversities_ReturnsOk_WithEmptyList_WhenNoUniverisities()
    {
        _service
            .Setup(s => s.GetActiveUniversitiesAsync())
            .Returns(Task.FromResult(new List<UniversityDto>()));

        var result = await _sut.GetActiveUniversities();

        var okResult = Assert.IsType<OkObjectResult>(result);
        var json = JsonSerializer.Serialize(okResult.Value);
        var response = JsonSerializer.Deserialize<Wrapper>(json);

        Assert.NotNull(response);
        Assert.Equal(0, response.Count);
        Assert.Empty(response.Data);
    }

    [Fact]
    public async Task GetActiveUniversities_Returns500_WhenServiceThrows()
    {
        _service.Setup(s => s.GetActiveUniversitiesAsync()).ThrowsAsync(new Exception("DB error"));

        await Assert.ThrowsAsync<Exception>(() => _sut.GetActiveUniversities());
    }

    private class Wrapper
    {
        [JsonPropertyName("count")]
        public int Count { get; set; }

        [JsonPropertyName("data")]
        public List<UniversityDto> Data { get; set; } = new();
    }
}
