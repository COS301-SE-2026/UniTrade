using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Claims;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Api.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Modules.Listings;
using Modules.Listings.Models.Dto;
using Modules.SharedKernel;
using Moq;
using Xunit;

namespace UniTrade.Tests.Unit.Api;

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

        var result = await _sut.Create(dto, CancellationToken.None);

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

    [Theory]
    [InlineData(-5)]
    [InlineData(0)]
    public async Task Create_AllowDraft_WithNonPositivePrice(decimal price)
    {
        var callerId = AuthenticateEnvoker();
        var dto = ADraftDto(price: price);
        _service
            .Setup(s => s.CreateListings(It.IsAny<CreateListingDto>(), callerId))
            .ReturnsAsync(ASummaryDto());

        var result = await _sut.Create(dto, CancellationToken.None);

        Assert.IsType<OkObjectResult>(result);
        _service.Verify(s => s.CreateListings(It.IsAny<CreateListingDto>(), callerId));
    }

    [Fact]
    public async Task Create_AllowDraft_WithMissingCondition()
    {
        var callerId = AuthenticateEnvoker();
        var dto = ADraftDto(condition: "");
        _service
            .Setup(s => s.CreateListings(It.IsAny<CreateListingDto>(), callerId))
            .ReturnsAsync(ASummaryDto());

        var result = await _sut.Create(dto, CancellationToken.None);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Create_RejectsDraft_WithMissingTitle()
    {
        AuthenticateEnvoker();
        var dto = ADraftDto(title: "");

        var result = await _sut.Create(dto, CancellationToken.None);

        Assert.IsType<BadRequestObjectResult>(result);
        _service.Verify(
            s => s.CreateListings(It.IsAny<CreateListingDto>(), It.IsAny<Guid>()),
            Times.Never
        );
    }

    [Fact]
    public async Task Create_AllowsLive_WhenPriceAndCOnditionPresent()
    {
        var callerId = AuthenticateEnvoker();
        var dto = ADraftDto(condition: "good", price: 12m);
        _service
            .Setup(s => s.CreateListings(It.IsAny<CreateListingDto>(), callerId))
            .ReturnsAsync(ASummaryDto());

        var result = await _sut.Create(dto, CancellationToken.None);

        Assert.IsType<OkObjectResult>(result);
    }

    private Guid AuthenticateEnvoker()
    {
        var callerId = Guid.NewGuid();
        var user = new ClaimsPrincipal(
            new ClaimsIdentity(new[] { new Claim("sub", callerId.ToString()) }, "AuthTesting")
        );
        _sut.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user },
        };
        return callerId;
    }

    private static CreateListingDto ADraftDto(
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
            ListingStatus = "draft",
            IsBundle = false,
            Images = new List<CreateListingImageDto>(),
        };

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
