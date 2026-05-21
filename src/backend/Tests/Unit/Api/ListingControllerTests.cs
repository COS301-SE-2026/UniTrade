using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;
using Api.Controllers;
using Modules.Listings;
using Modules.Listings.Models.Dto;
using Modules.SharedKernel;

namespace Api.Tests;

[Trait("Category", "Unit")]

public class ListingControllerTests
{
    private readonly Mock<IListingService> _service = new(MockBehavior.Strict);
    private readonly ListingController _sut;

    public ListingControllerTests() => _sut = new ListingController(_service.Object);


    // Create, validation guard


    [Theory]
    [InlineData("", "good", 100)]      // missing title
    [InlineData("Title", "", 100)]     // missing condition
    [InlineData("Title", "good", 0)]   // non-positive price
    [InlineData("Title", "good", -5)]
    public async Task Create_ReturnsBadRequest_AndSkipsService_WhenInputInvalid(
        string title, string condition, decimal price)
    {
        // Arrange
        var dto = ADto(title: title, condition: condition, price: price);

        // Act
        var result = await _sut.Create(dto);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result);
        _service.Verify(s => s.CreateListings(It.IsAny<ListingSummaryDto>()),
                        Times.Never);
    }

    [Fact]
    public async Task Create_ReturnsOkWithCreatedListing_WhenInputValid()
    {
        // Arrange
        var dto = ADto(title: "Valid", condition: "good", price: 50m);
        _service.Setup(s => s.CreateListings(dto)).ReturnsAsync(dto);

        // Act
        var result = await _sut.Create(dto);

        // Assert
        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Same(dto, ok.Value);
        _service.Verify(s => s.CreateListings(dto), Times.Once);
    }


    // Update
    [Fact]
    public async Task Update_ReturnsNotFound_WhenServiceReportsMissing()
    {
        // Arrange
        var id = Guid.NewGuid();
        var dto = ADto();
        _service.Setup(s => s.UpdateListings(dto, id)).ReturnsAsync(false);

        // Act
        var result = await _sut.Update(dto, id);

        // Assert
        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Update_ReturnsOk_WhenServiceReportsSuccess()
    {
        // Arrange
        var id = Guid.NewGuid();
        var dto = ADto();
        _service.Setup(s => s.UpdateListings(dto, id)).ReturnsAsync(true);

        // Act
        var result = await _sut.Update(dto, id);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }


    // Delete
    [Fact]
    public async Task Delete_ReturnsNotFound_WhenServiceReportsMissing()
    {
        // Arrange
        var id = Guid.NewGuid();
        _service.Setup(s => s.DeleteListings(id)).ReturnsAsync(false);

        // Act
        var result = await _sut.Delete(id);

        // Assert
        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Delete_ReturnsNoContent_WhenServiceReportsSuccess()
    {
        // Arrange
        var id = Guid.NewGuid();
        _service.Setup(s => s.DeleteListings(id)).ReturnsAsync(true);

        // Act
        var result = await _sut.Delete(id);

        // Assert
        Assert.IsType<NoContentResult>(result);
    }


    // GetAll
    [Fact]
    public async Task GetAll_ReturnsOkWithPagedResult()
    {
        // Arrange
        var filter = new ListFilterDto();
        var paged = new PagedResult<ListingSummaryDto>(
            new List<ListingSummaryDto> { ADto() }, 1);
        _service.Setup(s => s.ListAsync(filter)).ReturnsAsync(paged);

        // Act
        var result = await _sut.GetAll(filter);

        // Assert
        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Same(paged, ok.Value);
    }
    // GetById
    [Fact]
    public async Task GetById_ReturnsNotFound_WhenServiceReturnsNull()
    {
        // Arrange
        var id = Guid.NewGuid();
        _service.Setup(s => s.GetByIdAsync(id)).ReturnsAsync((ListingSummaryDto?)null);

        // Act
        var result = await _sut.GetById(id);

        // Assert
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task GetById_ReturnsOkWithListing_WhenFound()
    {
        // Arrange
        var dto = ADto();
        _service.Setup(s => s.GetByIdAsync(dto.ListingId)).ReturnsAsync(dto);

        // Act
        var result = await _sut.GetById(dto.ListingId);

        // Assert
        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Same(dto, ok.Value);
    }
    private static ListingSummaryDto ADto(
        string title = "Product",
        string condition = "good",
        decimal price = 100m) => new(
            ListingId: Guid.NewGuid(),
            SellerId: Guid.NewGuid(),
            Title: title,
            Description: "desc",
            Price: price,
            Condition: condition,
            ListingType: "other",
            CourseId: null,
            Isbn: null,
            Author: null,
            Edition: null,
            ListingStatus: "live",
            IsBundle: false,
            ViewCount: 0,
            CreatedAt: DateTime.UtcNow,
            UpdatedAt: DateTime.UtcNow,
            Images: new List<ListingImageDto>());
}