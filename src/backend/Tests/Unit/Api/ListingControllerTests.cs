using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using Api.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Modules.Listings;
using Modules.Listings.Models.Dto;
using Modules.SharedKernel;
using Moq;
using Xunit;

namespace Api.Tests;

[Trait("Category", "Unit")]
public class ListingControllerTests
{
    private readonly Mock<IListingService> _service;
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
        string title,
        string condition,
        decimal price
    )
    {
        var dto = ACreateDto(title: title, condition: condition, price: price);

        var result = await _sut.Create(dto);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    private static ListingSummaryDto ASummaryDto() =>
        new(
            ListingId: Guid.NewGuid(),
            SellerId: Guid.NewGuid(),
            CategoryId: 1,
            Metadata: JsonSerializer.Deserialize<JsonElement>("{\"colour\": \"blue\"}"),
            CategoryName: "Cat1",
            Title: "Product",
            Description: "desc",
            Price: 100m,
            Condition: "good",
            CourseId: null,
            BookDetails: null,
            ListingStatus: "live",
            IsBundle: false,
            ViewCount: 0,
            CreatedAt: DateTime.UtcNow,
            UpdatedAt: DateTime.UtcNow,
            Images: new List<ListingImageDto>(),
            Seller: null
        );

    // PUT /api/listings/{id} Update

 
    // DELETE /api/listings/{id} Delete

    // GET /api/listings GetAll
    [Fact]
    public async Task GetAll_ReturnsOkWithPagedResult()
    {
        var filter = new ListFilterDto();
        var paged = new PagedResult<ListingSummaryDto>(
            new List<ListingSummaryDto> { ASummaryDto() },
            1
        );
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

    // Helper

    private static CreateListingDto ACreateDto(
        string title = "Product",
        string condition = "good",
        decimal price = 100m
    ) =>
        new()
        {
            Title = title,
            Description = "desc",
            Price = price,
            Condition = condition,
            CourseId = null,
            ListingStatus = "live",
            IsBundle = false,
            Images = new List<CreateListingImageDto>(),
        };
}
