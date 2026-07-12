using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Api.Controllers;
using Microsoft.AspNetCore.Mvc;
using Modules.ReferenceData.Course;
using Modules.ReferenceData.Course.Models;
using Moq;
using Xunit;

namespace UniTrade.Tests.Unit.Api;

[Trait("Category", "Unit")]
public class CourseControllerTests
{
    private readonly Mock<ICourseService> _service;
    private readonly CourseController _sut;
    private readonly JsonSerializerOptions _jsonOptions;

    public CourseControllerTests()
    {
        _service = new Mock<ICourseService>();
        _sut = new CourseController(_service.Object);
        _jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
    }

    [Fact]
    public async Task Search_ReturnsOk_WithResults_WhenMatchesFound()
    {
        var courses = new List<CourseDto>
        {
            new CourseDto(
                CourseId : 2,
                CourseCode : "COS214",
                CourseName : "Software Design",
                Faculty : "EBIT"
            ),
            new CourseDto(
                CourseId : 1,
                CourseCode : "COS110",
                CourseName : "Program Design",
                Faculty : "EBIT"
            ),
        };

        _service
            .Setup(s => s.SearchAsync("COS", null, 20, It.IsAny<CancellationToken>()))
            .ReturnsAsync(courses);

        var result = await _sut.Search("COS", null, 20);

        var okResult = Assert.IsType<OkObjectResult>(result);

        Assert.Equal(courses, okResult.Value);
    }

    [Fact]
    public async Task Search_ReturnsOk_WithEmptyList_WhenNoMatchesFound()
    {
        _service
            .Setup(s => s.SearchAsync("COS", null, 20, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<CourseDto>());

        var result = await _sut.Search("COS", null, 20);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var list = Assert.IsType<List<CourseDto>>(okResult.Value);
        Assert.Empty(list);
    }

    [Fact]
    public async Task Search_Returns500_WhenServiceThrows()
    {
        _service
            .Setup(s =>
                s.SearchAsync(
                    It.IsAny<string>(),
                    It.IsAny<int?>(),
                    It.IsAny<int>(),
                    It.IsAny<CancellationToken>()
                )
            )
            .ThrowsAsync(new Exception("DB error"));

        await Assert.ThrowsAsync<Exception>(() => _sut.Search("COS", null, 20));
    }

    [Fact]
    public async Task GetById_ReturnsOk_WithCourse_WhenFound()
    {
        var course = new CourseDto(
            CourseId: 1,
            CourseCode: "COS110",
            CourseName: "Program Design",
            Faculty: "EBIT"
        );

        _service.Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(course);

        var result = await _sut.GetById(1, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);

        Assert.Equal(course, okResult.Value);
    }

    [Fact]
    public async Task GetById_Returns500_WhenServiceThrows()
    {
        _service
            .Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("DB error"));

        await Assert.ThrowsAsync<Exception>(() => _sut.GetById(1, CancellationToken.None));
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_WhenCourseNotFound()
    {
        _service
            .Setup(s => s.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync((CourseDto?)null);

        var result = await _sut.GetById(1, CancellationToken.None);
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        var json = JsonSerializer.Serialize(notFoundResult.Value);

        var response =JsonSerializer.Deserialize<ErrorResponse>(json, _jsonOptions);
        Assert.Equal("course_not_found", response?.Error);
    }

    private class ErrorResponse
    {
        public string Error { get; set; } = string.Empty;
    }
}
