using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Moq;
using Xunit;
using Modules.Listings;
using Modules.Listings.Models;
using Modules.Listings.Models.Dto;
using Modules.Listings.Repositories;
using Modules.SharedKernel;

namespace Modules.Listings.Tests;

[Trait("Category", "Unit")]
public class ListingServiceTests
{
    private readonly Mock<IBlobStorageService> _blob = new(MockBehavior.Strict);
    private readonly Mock<IListingRepository> _repo = new(MockBehavior.Strict);
    private readonly ListingService _sut;

    public ListingServiceTests()
    {
        _sut = new ListingService(_repo.Object, _blob.Object);
    }

    // GetByIdAsync

    [Fact]
    public async Task GetByIdAsync_ReturnsNull_WhenListingDoesNotExist()
    {
        var id = Guid.NewGuid();
        _repo.Setup(r => r.GetByIdAsync(id)).ReturnsAsync((Listing?)null);

        var result = await _sut.GetByIdAsync(id);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsMappedSummary_WhenListingExists()
    {
        var listing = AListing(title: "Calculus Textbook", price: 250m);
        _repo.Setup(r => r.GetByIdAsync(listing.ListingId)).ReturnsAsync(listing);
        SetupBlobForListing(listing);

        var result = await _sut.GetByIdAsync(listing.ListingId);

        Assert.NotNull(result);
        Assert.Equal(listing.ListingId, result!.ListingId);
        Assert.Equal("Calculus Textbook", result.Title);
        Assert.Equal(250m, result.Price);
    }
    [Fact]
    public async Task GetByIdAsync_CallsBlobGetReadUrl_ForEachImage()
    {
        var images = new List<ListingImage> { AnImage(url: "a.jpg"), AnImage(url: "b.jpg") };
        var listing = AListing(images: images);
        _repo.Setup(r => r.GetByIdAsync(listing.ListingId)).ReturnsAsync(listing);
        _blob.Setup(b => b.GetReadUrl(It.IsAny<string>(), null)).Returns("https://some_url");

        await _sut.GetByIdAsync(listing.ListingId);

        _blob.Verify(b => b.GetReadUrl("a.jpg", null), Times.Once);
        _blob.Verify(b => b.GetReadUrl("b.jpg", null), Times.Once);
    }

    [Fact]
    public async Task GetByIdAsync_OrdersImagesByPrimaryFirst()
    {
        var otherPic = AnImage(isPrimary: false, url: "otherPic.jpg");
        var mainPic = AnImage(isPrimary: true, url: "mainPic.jpg");
        var listing = AListing(images: new List<ListingImage> { otherPic, mainPic });
        _repo.Setup(r => r.GetByIdAsync(listing.ListingId)).ReturnsAsync(listing);
        SetupBlobForListing(listing, blobSuffix: "?sas");

        var result = await _sut.GetByIdAsync(listing.ListingId);

        Assert.Equal("mainPic.jpg?sas", result!.Images.First().path);
        Assert.True(result.Images.First().IsPrimary);
    }

    // ListAsync

    [Fact]
    public async Task ListAsync_ReturnsMappedItems_AndPreservesTotalCount()
    {
        var filter = new ListFilterDto();
        var listings = new List<Listing> { AListing(title: "A"), AListing(title: "B") };
        _repo.Setup(r => r.ListAsync(filter)).ReturnsAsync((listings, 57));
        _blob.Setup(b => b.GetReadUrl(It.IsAny<string>(), null)).Returns("https://some_url");

        var result = await _sut.ListAsync(filter);

        Assert.Equal(2, result.Items.Count);
        Assert.Equal(57, result.Total);
        Assert.Contains(result.Items, i => i.Title == "A");
        Assert.Contains(result.Items, i => i.Title == "B");
    }

    [Fact]
    public async Task GetByIdAsync_MapsIsBundle_AsFalse_WhenNull()
    {
        var listing = AListing();
        listing.isBundle = null;
        _repo.Setup(r => r.GetByIdAsync(listing.ListingId)).ReturnsAsync(listing);
        SetupBlobForListing(listing);

        var result = await _sut.GetByIdAsync(listing.ListingId);

        Assert.False(result!.IsBundle);
    }
    [Fact]
    public async Task ListAsync_ReturnsEmptyResult_WhenRepositoryReturnsNoItems()
    {
        var filter = new ListFilterDto();
        _repo.Setup(r => r.ListAsync(filter)).ReturnsAsync((new List<Listing>(), 0));

        var result = await _sut.ListAsync(filter);

        Assert.Empty(result.Items);
        Assert.Equal(0, result.Total);
    }
    // CreateListings
    [Fact]
    public async Task CreateListings_MapsDtoFields_AndPersistsEntity()
    {
        Listing? captured = null;
        var dto = ACreateDto(title: "Lab Coat", price: 120m, condition: "good");
        _repo.Setup(r => r.AddAsync(It.IsAny<Listing>()))
             .Callback<Listing>(l => captured = l)
             .Returns(Task.CompletedTask);
        _blob.Setup(b => b.GetReadUrl(It.IsAny<string>(), null)).Returns("https://some_url");

        var result = await _sut.CreateListings(dto);

        Assert.NotNull(captured);
        Assert.Equal("Lab Coat", captured!.Title);
        Assert.Equal(120m, captured.Price);
        Assert.Equal("good", captured.Condition);
        Assert.Equal("Lab Coat", result.Title);
    }
    [Fact]
    public async Task CreateListings_StampsCreatedAt_WithUtcNow()
    {
        var before = DateTime.UtcNow;
        Listing? captured = null;
        _repo.Setup(r => r.AddAsync(It.IsAny<Listing>()))
             .Callback<Listing>(l => captured = l)
             .Returns(Task.CompletedTask);
        _blob.Setup(b => b.GetReadUrl(It.IsAny<string>(), null)).Returns("https://some_url");

        await _sut.CreateListings(ACreateDto());

        var after = DateTime.UtcNow;
        Assert.InRange(captured!.CreatedAt, before, after);
    }

    [Fact]
    public async Task CreateListings_Throws_WhenImagesIsNull()
    {
        var dto = ACreateDto(); dto.Images = null!;

        await Assert.ThrowsAsync<ArgumentNullException>(() => _sut.CreateListings(dto));
        _repo.Verify(r => r.AddAsync(It.IsAny<Listing>()), Times.Never);
    }
   

    [Fact]
    public async Task GetByIdAsync_MapsIsBundle_AsTrue_WhenSet()
    {
        var listing = AListing();
        listing.isBundle = true;
        _repo.Setup(r => r.GetByIdAsync(listing.ListingId)).ReturnsAsync(listing);
        SetupBlobForListing(listing);

        var result = await _sut.GetByIdAsync(listing.ListingId);

        Assert.True(result!.IsBundle);
    }
     [Fact]
    public async Task CreateListings_MapsImages_AndReturnsSignedUrls()
    {
        var imageDto = new CreateListingImageDto { ImageUrl = "raw.jpg", IsPrimary = true };
        var dto = ACreateDto(images: new List<CreateListingImageDto> { imageDto });
        _repo.Setup(r => r.AddAsync(It.IsAny<Listing>())).Returns(Task.CompletedTask);
        _blob.Setup(b => b.GetReadUrl("raw.jpg", null)).Returns("https://images_herr");

        var result = await _sut.CreateListings(dto);

        var img = Assert.Single(result.Images);
        Assert.Equal("https://images_herr", img.path);
        Assert.True(img.IsPrimary);
    }

    [Fact]
    public async Task GetByIdAsync_MapsViewCount_AsZero_WhenNull()
    {
        var listing = AListing();
        listing.ViewCount = null;
        _repo.Setup(r => r.GetByIdAsync(listing.ListingId)).ReturnsAsync(listing);
        SetupBlobForListing(listing);
        var result = await _sut.GetByIdAsync(listing.ListingId);
        Assert.Equal(0, result!.ViewCount);
    }

    [Fact]
    public async Task CreateListings_AssignsNewListingId()
    {
        Listing? captured = null;
        _repo.Setup(r => r.AddAsync(It.IsAny<Listing>()))
             .Callback<Listing>(l => captured = l)
             .Returns(Task.CompletedTask);
        _blob.Setup(b => b.GetReadUrl(It.IsAny<string>(), null)).Returns("https://images_herr");

        await _sut.CreateListings(ACreateDto());

        Assert.NotEqual(Guid.Empty, captured!.ListingId);
    }

    // UpdateListings

    [Fact]
    public async Task UpdateListings_ReturnsTrue_AndPersists_WhenFound()
    {
        var existing = AListing();
        _repo.Setup(r => r.GetByIdAsync(existing.ListingId)).ReturnsAsync(existing);
        _repo.Setup(r => r.UpdateAsync(existing, existing.ListingId)).Returns(Task.CompletedTask);
        var result = await _sut.UpdateListings(AnUpdateDto(), existing.ListingId);
        Assert.True(result);
        _repo.Verify(r => r.UpdateAsync(existing, existing.ListingId), Times.Once);
    }
    [Fact]
    public async Task UpdateListings_ReturnsFalse_AndSkipsUpdate_WhenNotFound()
    {
        var id = Guid.NewGuid();
        _repo.Setup(r => r.GetByIdAsync(id)).ReturnsAsync((Listing?)null);
        var result = await _sut.UpdateListings(AnUpdateDto(), id);
        Assert.False(result);
        _repo.Verify(r => r.UpdateAsync(It.IsAny<Listing>(), It.IsAny<Guid>()), Times.Never);
    }

    [Fact]
    public async Task UpdateListings_OnlyMutatesEditableFields()
    {
        var existing = AListing(title: "old", price: 10m, condition: "fair");
        existing.ListingType = "book";
        _repo.Setup(r => r.GetByIdAsync(existing.ListingId)).ReturnsAsync(existing);
        _repo.Setup(r => r.UpdateAsync(existing, existing.ListingId)).Returns(Task.CompletedTask);

        var dto = AnUpdateDto(title: "new", price: 9m, condition: "new");
        await _sut.UpdateListings(dto, existing.ListingId);

        Assert.Equal("new", existing.Title);
        Assert.Equal("new", existing.Condition);
        Assert.Equal(9m, existing.Price);
        Assert.Equal("book", existing.ListingType);
    }
    [Fact]
    public async Task UpdateListings_RefreshesUpdatedAt()
    {
        var existing = AListing();
        existing.UpdatedAt = DateTime.UtcNow.AddDays(-5);
        _repo.Setup(r => r.GetByIdAsync(existing.ListingId)).ReturnsAsync(existing);
        _repo.Setup(r => r.UpdateAsync(existing, existing.ListingId)).Returns(Task.CompletedTask);
        var before = DateTime.UtcNow;
        await _sut.UpdateListings(AnUpdateDto(), existing.ListingId);
        Assert.InRange(existing.UpdatedAt, before, DateTime.UtcNow);
    }

    [Fact]
    public async Task GetByIdAsync_MapsViewCount_WhenSet()
    {
        var listing = AListing();
        listing.ViewCount = 42;
        _repo.Setup(r => r.GetByIdAsync(listing.ListingId)).ReturnsAsync(listing);
        SetupBlobForListing(listing);

        var result = await _sut.GetByIdAsync(listing.ListingId);

        Assert.Equal(42, result!.ViewCount);
    }
    // DeleteListings
    [Fact]
    public async Task DeleteListings_ReturnsFalse_AndSkipsDelete_WhenNotFound()
    {
        var id = Guid.NewGuid();
        _repo.Setup(r => r.GetByIdAsync(id)).ReturnsAsync((Listing?)null);
        var result = await _sut.DeleteListings(id);
        Assert.False(result);
        _repo.Verify(r => r.DeleteByIdAsync(It.IsAny<Guid>()), Times.Never);
    }
    [Fact]
    public async Task DeleteListings_ReturnsTrue_AndDeletes_WhenFound()
    {
        var existing = AListing();
        _repo.Setup(r => r.GetByIdAsync(existing.ListingId)).ReturnsAsync(existing);
        _repo.Setup(r => r.DeleteByIdAsync(existing.ListingId)).Returns(Task.CompletedTask);
        var result = await _sut.DeleteListings(existing.ListingId);
        Assert.True(result);
        _repo.Verify(r => r.DeleteByIdAsync(existing.ListingId), Times.Once);
    }
    private void SetupBlobForListing(Listing listing, string blobSuffix = "")
    {
        foreach (var img in listing.Images)
            _blob.Setup(b => b.GetReadUrl(img.ImageUrl, null))
                 .Returns(img.ImageUrl + blobSuffix);

        if (!listing.Images.Any())
            _blob.Setup(b => b.GetReadUrl(It.IsAny<string>(), null))
                 .Returns("https://images_herr");
    }
    [Fact]
    public async Task ListAsync_PassesFilterToRepository_Unchanged()
    {
        var filter = new ListFilterDto { Search = "chemistry", ListingType = "book"};
        _repo.Setup(r => r.ListAsync(filter)).ReturnsAsync((new List<Listing>(), 0));
        await _sut.ListAsync(filter);
        _repo.Verify(r => r.ListAsync(filter), Times.Once);
    }
    [Fact]
    public async Task ListAsync_ReturnsMappedItems_WhenFilterHasSellerAndStatus()
    {
        var filter = new ListFilterDto { ListingStatus = "live", SellerId = Guid.NewGuid() };
        var listings = Enumerable.Range(0, 5).Select(_ => AListing()).ToList();
        _repo.Setup(r => r.ListAsync(filter)).ReturnsAsync((listings, 100));
        _blob.Setup(b => b.GetReadUrl(It.IsAny<string>(), null)).Returns("https://some_url");

        var result = await _sut.ListAsync(filter);
        Assert.Equal(5, result.Items.Count);
        Assert.Equal(100, result.Total);
    }

    private static Listing AListing(
        string title = "Sample",
        string description = "desc",
        decimal price = 100m,
        string condition = "good",
        List<ListingImage>? images = null) => new()
        {
            ListingId = Guid.NewGuid(),
            SellerId = Guid.NewGuid(),
            Title = title,
            Description = description,
            Price = price,
            Condition = condition,
            ListingType = "other",
            ListingStatus = "live",
            isBundle = false,
            ViewCount = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Images = images ?? new List<ListingImage>()
        };

    private static ListingImage AnImage(bool isPrimary = false, string url = "img.jpg") => new()
    {
        ImageUrl = url,
        IsPrimary = isPrimary
    };
    private static UpdateListingDto AnUpdateDto(
        string title = "Updated Entity",
        string description = "updated entity",
        decimal price = 200m, string condition = "good")
        => new()
        {
            Title = title,
            Description = description,
            Price = price,
            Condition = condition
        };
    private static CreateListingDto ACreateDto(
        string title = "Sample",
        string description = "desc",
        decimal price = 100m,
        string condition = "good", List<CreateListingImageDto>? images = null) => new()
        {
            SellerId = Guid.NewGuid(),
            Title = title,
            Description = description,
            Price = price,
            Condition = condition,
            ListingType = "other",
            CourseId = null,
            Isbn = null,
            Author = "James Edwin Baloyi",
            Edition = null,
            ListingStatus = "live",
            IsBundle = false,
            Images = images ?? new List<CreateListingImageDto>()
        };

}