using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
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
    private readonly Mock<IImageStorageService> _imageStorage;

    private readonly ListingController _sut;

    public ListingControllerTests()
    {
        _service = new Mock<IListingService>();
        _imageStorage = new Mock<IImageStorageService>();
        _sut = new ListingController(_service.Object, _imageStorage.Object);

    }
    // POST /api/listings Create
    [Theory]
    [InlineData("", "good", 100)]
    [InlineData("Title", "", 100)]
    [InlineData("Title", "good", 0)]
    [InlineData("Title", "good", -5)]
    public async Task Create_ReturnsBadRequest_AndSkipsService_WhenInputInvalid(
        string title, string condition, decimal price)
    {
        var dto = ACreateDto(title: title, condition: condition, price: price);

        var result = await _sut.Create(dto);

        Assert.IsType<BadRequestObjectResult>(result);
        _service.Verify(s => s.CreateListings(It.IsAny<CreateListingDto>()), Times.Never);
    }

    private static ListingSummaryDto ASummaryDto() => new(
         ListingId: Guid.NewGuid(),
         SellerId: Guid.NewGuid(),
         Title: "Product",
         Description: "desc",
         Price: 100m,
         Condition: "good",
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


    [Fact]
    public async Task Create_ReturnsOkWithCreatedListing_WhenInputValid()
    {
        var dto = ACreateDto(title: "Valid", condition: "good", price: 50m);
        var summary = ASummaryDto();
        _service.Setup(s => s.CreateListings(dto)).ReturnsAsync(summary);

        var result = await _sut.Create(dto);

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Same(summary, ok.Value);
        _service.Verify(s => s.CreateListings(dto), Times.Once);
    }


    // PUT /api/listings/{id} Update

    private static UpdateListingDto AnUpdateDto(
        string title = "Updated",
        string description = "desc",
        decimal price = 100m, string condition = "good") => new()
        {
            Title = title,
            Description = description,
            Price = price,
            Condition = condition
        };


    [Fact]
    public async Task Delete_ReturnsNoContent_WhenServiceReportsSuccess()
    {
        var id = Guid.NewGuid();
        _service.Setup(s => s.DeleteListings(id)).ReturnsAsync(true);

        var result = await _sut.Delete(id);

        Assert.IsType<NoContentResult>(result);
    }

    // DELETE /api/listings/{id} Delete
    [Fact]
    public async Task Delete_ReturnsNotFound_WhenServiceReportsMissing()
    {
        var id = Guid.NewGuid();
        _service.Setup(s => s.DeleteListings(id)).ReturnsAsync(false);
        var result = await _sut.Delete(id);
        Assert.IsType<NotFoundResult>(result);
    }

    // GET /api/listings GetAll
    [Fact]
    public async Task GetAll_ReturnsOkWithPagedResult()
    {
        var filter = new ListFilterDto();
        var paged = new PagedResult<ListingSummaryDto>(
            new List<ListingSummaryDto> { ASummaryDto() }, 1);
        _service.Setup(s => s.ListAsync(filter)).ReturnsAsync(paged);

        var result = await _sut.GetAll(filter);
        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Same(paged, ok.Value);
    }

    // GET /api/listings/{id} GetById
    [Fact]
    public async Task GetById_ReturnsNotFound_WhenServiceReturnsNull()
    {
        var id = Guid.NewGuid();
        _service.Setup(s => s.GetByIdAsync(id)).ReturnsAsync((ListingSummaryDto?)null);
        var result = await _sut.GetById(id);
        Assert.IsType<NotFoundObjectResult>(result);
    }
    [Fact]
    public async Task GetById_ReturnsOkWithListing_WhenFound()
    {
        var dto = ASummaryDto();
        _service.Setup(s => s.GetByIdAsync(dto.ListingId)).ReturnsAsync(dto);
        var result = await _sut.GetById(dto.ListingId);
        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Same(dto, ok.Value);
    }

    // POST /api/listings/images UploadImages

    // Helpers
    private static IFormFile AFormFile(
        string contentType = "image/jpeg",
        long length = 1024,
        string name = "testImage.jpg")
    {
        var mock = new Mock<IFormFile>();
        mock.Setup(f => f.ContentType).Returns(contentType);
        mock.Setup(f => f.Length).Returns(length);
        mock.Setup(f => f.FileName).Returns(name);
        mock.Setup(f => f.OpenReadStream()).Returns(new MemoryStream(new byte[length]));
        return mock.Object;
    }

    private static CreateListingDto ACreateDto(
        string title = "Product",
        string condition = "good", decimal price = 100m) => new()
        {
            SellerId = Guid.NewGuid(),
            Title = title,
            Description = "desc",
            Price = price,
            Condition = condition,
            ListingType = "other",
            CourseId = null,
            Isbn = null,
            Author = null,
            Edition = null,
            ListingStatus = "live",
            IsBundle = false,
            Images = new List<CreateListingImageDto>()
        };
}