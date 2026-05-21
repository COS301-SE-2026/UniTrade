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
    private readonly Mock<IListingRepository> _repo = new(MockBehavior.Strict);
    private readonly ListingService _sut;

    public ListingServiceTests() => _sut = new ListingService(_repo.Object);

    // GetByIdAsync

    [Fact]
    public async Task GetByIdAsync_ReturnsNull_WhenListingDoesNotExist()
    {
        // Arrange
        var id = Guid.NewGuid();
        _repo.Setup(r => r.GetByIdAsync(id))
             .ReturnsAsync((Listing?)null);

        // Act
        var result = await _sut.GetByIdAsync(id);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsMappedSummary_WhenListingExists()
    {
        // Arrange
        var listing = AListing(title: "Calculus Textbook", price: 250m);
        _repo.Setup(r => r.GetByIdAsync(listing.ListingId))
             .ReturnsAsync(listing);

        // Act
        var result = await _sut.GetByIdAsync(listing.ListingId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(listing.ListingId, result!.ListingId);
        Assert.Equal("Calculus Textbook", result.Title);
        Assert.Equal(250m, result.Price);
    }

    [Fact]
    public async Task GetByIdAsync_OrdersImagesByPrimaryFirst()
    {
        // Arrange
        var secondary = AnImage(isPrimary: false, url: "secondary.jpg");
        var primary = AnImage(isPrimary: true, url: "primary.jpg");
        var listing = AListing(images: new List<ListingImage> { secondary, primary });
        _repo.Setup(r => r.GetByIdAsync(listing.ListingId))
             .ReturnsAsync(listing);

        // Act
        var result = await _sut.GetByIdAsync(listing.ListingId);

        // Assert
        Assert.Equal("primary.jpg", result!.Images.First().path);
        Assert.True(result.Images.First().IsPrimary);
    }

    // ListAsync

    [Fact]
    public async Task ListAsync_ReturnsMappedItems_AndPreservesTotalCount()
    {
        // Arrange
        var filter = new ListFilterDto();
        var listings = new List<Listing> { AListing(title: "A"), AListing(title: "B") };
        _repo.Setup(r => r.ListAsync(filter))
             .ReturnsAsync((listings, 57));

        // Act
        var result = await _sut.ListAsync(filter);

        // Assert
        Assert.Equal(2, result.Items.Count);
        Assert.Equal(57, result.Total);
        Assert.Contains(result.Items, i => i.Title == "A");
        Assert.Contains(result.Items, i => i.Title == "B");
    }

    [Fact]
    public async Task ListAsync_ReturnsEmptyResult_WhenRepositoryReturnsNoItems()
    {
        // Arrange
        var filter = new ListFilterDto();
        _repo.Setup(r => r.ListAsync(filter))
             .ReturnsAsync((new List<Listing>(), 0));

        // Act
        var result = await _sut.ListAsync(filter);

        // Assert
        Assert.Empty(result.Items);
        Assert.Equal(0, result.Total);
    }

    // CreateListings

    [Fact]
    public async Task CreateListings_MapsDtoFields_AndPersistsEntity()
    {
        // Arrange
        Listing? captured = null;
        var dto = ADto(title: "Lab Coat", price: 120m, condition: "good");
        _repo.Setup(r => r.AddAsync(It.IsAny<Listing>()))
             .Callback<Listing>(l => captured = l)
             .Returns(Task.CompletedTask);

        // Act
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
        // Arrange
        var before = DateTime.UtcNow;
        Listing? captured = null;
        _repo.Setup(r => r.AddAsync(It.IsAny<Listing>()))
             .Callback<Listing>(l => captured = l)
             .Returns(Task.CompletedTask);

        // Act
        await _sut.CreateListings(ADto());

        // Assert
        var after = DateTime.UtcNow;
        Assert.InRange(captured!.CreatedAt, before, after);
    }

    [Fact]
    public async Task CreateListings_Throws_WhenImagesIsNull()
    {
        // Arrange
        var dto = ADto() with { Images = null! };

        // Act / Assert
        await Assert.ThrowsAsync<ArgumentNullException>(
       () => _sut.CreateListings(dto));
        _repo.Verify(r => r.AddAsync(It.IsAny<Listing>()), Times.Never);
    }

    // UpdateListings

    [Fact]
    public async Task UpdateListings_ReturnsFalse_AndSkipsUpdate_WhenNotFound()
    {
        // Arrange
        var id = Guid.NewGuid();
        _repo.Setup(r => r.GetByIdAsync(id))
             .ReturnsAsync((Listing?)null);

        // Act
        var result = await _sut.UpdateListings(ADto(), id);

        // Assert
        Assert.False(result);
        _repo.Verify(r => r.UpdateAsync(It.IsAny<Listing>(), It.IsAny<Guid>()),
                     Times.Never);
    }

    [Fact]
    public async Task UpdateListings_ReturnsTrue_AndPersists_WhenFound()
    {
        // Arrange
        var existing = AListing();
        _repo.Setup(r => r.GetByIdAsync(existing.ListingId))
             .ReturnsAsync(existing);
        _repo.Setup(r => r.UpdateAsync(existing, existing.ListingId))
             .Returns(Task.CompletedTask);

        // Act
        var result = await _sut.UpdateListings(ADto(), existing.ListingId);

        // Assert
        Assert.True(result);
        _repo.Verify(r => r.UpdateAsync(existing, existing.ListingId), Times.Once);
    }

    [Fact]
    public async Task UpdateListings_OnlyMutatesEditableFields()
    {
        // Arrange — existing has a ListingType the DTO will try to change
        var existing = AListing(title: "old", price: 10m, condition: "fair");
        existing.ListingType = "book";
        _repo.Setup(r => r.GetByIdAsync(existing.ListingId))
             .ReturnsAsync(existing);
        _repo.Setup(r => r.UpdateAsync(existing, existing.ListingId))
             .Returns(Task.CompletedTask);

        var dto = ADto(title: "new", price: 999m, condition: "new");

        // Act
        await _sut.UpdateListings(dto, existing.ListingId);

        // Assert
        Assert.Equal("new", existing.Title);
        Assert.Equal(999m, existing.Price);
        Assert.Equal("new", existing.Condition);
        Assert.Equal("book", existing.ListingType);
    }

    [Fact]
    public async Task UpdateListings_RefreshesUpdatedAt()
    {
        // Arrange
        var existing = AListing();
        existing.UpdatedAt = DateTime.UtcNow.AddDays(-5);
        _repo.Setup(r => r.GetByIdAsync(existing.ListingId))
             .ReturnsAsync(existing);
        _repo.Setup(r => r.UpdateAsync(existing, existing.ListingId))
             .Returns(Task.CompletedTask);

        var before = DateTime.UtcNow;

        // Act
        await _sut.UpdateListings(ADto(), existing.ListingId);

        // Assert
        Assert.InRange(existing.UpdatedAt, before, DateTime.UtcNow);
    }

    // DeleteListings

    [Fact]
    public async Task DeleteListings_ReturnsFalse_AndSkipsDelete_WhenNotFound()
    {
        // Arrange
        var id = Guid.NewGuid();
        _repo.Setup(r => r.GetByIdAsync(id))
             .ReturnsAsync((Listing?)null);

        // Act
        var result = await _sut.DeleteListings(id);

        // Assert
        Assert.False(result);
        _repo.Verify(r => r.DeleteByIdAsync(It.IsAny<Guid>()), Times.Never);
    }

    [Fact]
    public async Task DeleteListings_ReturnsTrue_AndDeletes_WhenFound()
    {
        // Arrange
        var existing = AListing();
        _repo.Setup(r => r.GetByIdAsync(existing.ListingId))
             .ReturnsAsync(existing);
        _repo.Setup(r => r.DeleteByIdAsync(existing.ListingId))
             .Returns(Task.CompletedTask);

        // Act
        var result = await _sut.DeleteListings(existing.ListingId);

        // Assert
        Assert.True(result);
        _repo.Verify(r => r.DeleteByIdAsync(existing.ListingId), Times.Once);
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

    private static ListingSummaryDto ADto(
        string title = "Sample",
        string description = "desc",
        decimal price = 100m,
        string condition = "good",
        List<ListingImageDto>? images = null) => new(
            ListingId: Guid.NewGuid(),
            SellerId: Guid.NewGuid(),
            Title: title,
            Description: description,
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
            Images: images ?? new List<ListingImageDto>());
}