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
    private readonly Mock<IListingRepository> _repo;
    private readonly Mock<IListingImageRepository> _imageRepo;
    private readonly ListingService _sut;

    public ListingServiceTests()
    {
        _repo = new Mock<IListingRepository>();
        _imageRepo = new Mock<IListingImageRepository>();
        _sut = new ListingService(_repo.Object, _imageRepo.Object);

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

        var result = await _sut.GetByIdAsync(listing.ListingId);

        Assert.NotNull(result);
        Assert.Equal(listing.ListingId, result!.ListingId);
        Assert.Equal("Calculus Textbook", result.Title);
        Assert.Equal(250m, result.Price);
    }


    // ListAsync

    [Fact]
    public async Task ListAsync_ReturnsMappedItems_AndPreservesTotalCount()
    {
        var filter = new ListFilterDto();
        var listings = new List<Listing> { AListing(title: "A"), AListing(title: "B") };
        _repo.Setup(r => r.ListAsync(filter)).ReturnsAsync((listings, 57));

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
    public async Task GetByIdAsync_MapsIsBundle_AsTrue_WhenSet()
    {
        var listing = AListing();
        listing.isBundle = true;
        _repo.Setup(r => r.GetByIdAsync(listing.ListingId)).ReturnsAsync(listing);

        var result = await _sut.GetByIdAsync(listing.ListingId);

        Assert.True(result!.IsBundle);
    }

    [Fact]
    public async Task GetByIdAsync_MapsViewCount_AsZero_WhenNull()
    {
        var listing = AListing();
        listing.ViewCount = null;
        _repo.Setup(r => r.GetByIdAsync(listing.ListingId)).ReturnsAsync(listing);
        var result = await _sut.GetByIdAsync(listing.ListingId);
        Assert.Equal(0, result!.ViewCount);
    }

    // UpdateListings

    
    [Fact]
    public async Task UpdateListings_ReturnsFalse_AndSkipsUpdate_WhenNotFound()
    {
        var id = Guid.NewGuid();
        _repo.Setup(r => r.GetByIdAsync(id)).ReturnsAsync((Listing?)null);
        _repo.Verify(r => r.UpdateAsync(It.IsAny<Listing>(), It.IsAny<Guid>()), Times.Never);
    }

    

    [Fact]
    public async Task GetByIdAsync_MapsViewCount_WhenSet()
    {
        var listing = AListing();
        listing.ViewCount = 42;
        _repo.Setup(r => r.GetByIdAsync(listing.ListingId)).ReturnsAsync(listing);

        var result = await _sut.GetByIdAsync(listing.ListingId);

        Assert.Equal(42, result!.ViewCount);
    }
    // DeleteListings
    [Fact]
    public async Task DeleteListings_ReturnsFalse_AndSkipsDelete_WhenNotFound()
    {
        var id = Guid.NewGuid();
        _repo.Setup(r => r.GetByIdAsync(id)).ReturnsAsync((Listing?)null);
        _repo.Verify(r => r.DeleteByIdAsync(It.IsAny<Guid>()), Times.Never);
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
            ListingStatus = "live",
            isBundle = false,
            ViewCount = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Images = images ?? new List<ListingImage>()
        };


}