using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Modules.Identity.Models;
using Modules.Listings;
using Modules.Listings.Models;
using Modules.Listings.Models.Dto;
using Modules.Listings.Repositories;
using Modules.SharedKernel;
using Moq;
using Xunit;

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

    // GetByIdAsync Tests

    [Fact]
    public async Task GetByIdAsync_ReturnsNull_WhenListingDoesNotExist()
    {
        //Arrange
        var id = Guid.NewGuid();
        _repo.Setup(r => r.GetByIdAsync(id)).ReturnsAsync((Listing?)null);

        //Act
        var result = await _sut.GetByIdAsync(id);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsMappedSummary_WhenListingExists()
    {
        // Arrange
        var listing = AListing(title: "Calculus Textbook", price: 250m);
        _repo.Setup(r => r.GetByIdAsync(listing.ListingId)).ReturnsAsync(listing);

        // Act
        var result = await _sut.GetByIdAsync(listing.ListingId);

        // Assert

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
        listing.IsBundle = null;
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
        listing.IsBundle = true;
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
        var dto = new UpdateListingDto();
        _repo.Setup(r => r.GetByIdAsync(id)).ReturnsAsync((Listing?)null);
        var result = await _sut.UpdateListings(dto, id, Guid.NewGuid(), CancellationToken.None);

        Assert.False(result);
        _repo.Verify(r => r.UpdateAsync(It.IsAny<Listing>(), It.IsAny<Guid>()), Times.Never);
    }

    [Fact]
    public async Task UpdateListings_ThrowsUnauthorizedAccessException_WhenNotOwner()
    {
        var sellerId = Guid.NewGuid();
        var callerId = Guid.NewGuid();
        var listing = AListing(sellerId: sellerId);

        var dto = new UpdateListingDto { Title = "Title noe updated" };
        _repo.Setup(r => r.GetByIdTrackedAsync(listing.ListingId)).ReturnsAsync((listing));

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _sut.UpdateListings(dto, listing.ListingId, callerId, CancellationToken.None)
        );
    }

    [Fact]
    public async Task UpdateListings_UpdatesListing_WhenOwner()
    {
        var sellerId = Guid.NewGuid();
        var listing = AListing(sellerId: sellerId);

        var dto = new UpdateListingDto
        {
            Title = "Title now updated",
            Description = "Updated",
            Price = 21m,
            Condition = "fair",
        };
        _repo.Setup(r => r.GetByIdTrackedAsync(listing.ListingId)).ReturnsAsync((listing));

        var result = await _sut.UpdateListings(
            dto,
            listing.ListingId,
            sellerId,
            CancellationToken.None
        );

        Assert.True(result);
        _repo.Verify(r => r.SaveAsync(), Times.Once);
        Assert.Equal("Title now updated", listing.Title);
        Assert.Equal("Updated", listing.Description);
        Assert.Equal(21m, listing.Price);
        Assert.Equal("fair", listing.Condition);
    }

    [Fact]
    public async Task UpdateListings_UpdatesBookDetails_WhenBookListing()
    {
        var sellerId = Guid.NewGuid();
        var category = new ListingCategory { CategoryId = 1, Name = "book" };
        var listing = AListing(sellerId: sellerId, category: category);
        listing.BookDetails = new BookDetails
        {
            ListingId = listing.ListingId,
            Isbn = "268384627283",
            Author = "Prev. Auth",
            Edition = "2nd",
        };
        var dto = new UpdateListingDto
        {
            Title = "Title updated",
            Description = "Updated",
            Price = 21m,
            Condition = "fair",
            BookDetails = new BookDetailsDto
            {
                Isbn = "23454324943",
                Author = "Now Auth.",
                Edition = "3rd",
            },
        };
        _repo.Setup(r => r.GetByIdTrackedAsync(listing.ListingId)).ReturnsAsync((listing));

        var result = await _sut.UpdateListings(
            dto,
            listing.ListingId,
            sellerId,
            CancellationToken.None
        );

        Assert.True(result);
        _repo.Verify(r => r.SaveAsync(), Times.Once);
        Assert.Equal("23454324943", listing.BookDetails.Isbn);
        Assert.Equal("Now Auth.", listing.BookDetails.Author);
        Assert.Equal("3rd", listing.BookDetails.Edition);
    }

    [Fact]
    public async Task UpdateListings_UpdatesCategory_WhenCategoryNameProvided()
    {
        var sellerId = Guid.NewGuid();
        var oldCategory = new ListingCategory { CategoryId = 1, Name = "book" };
        var newCategory = new ListingCategory { CategoryId = 2, Name = "electronics" };

        var listing = AListing(sellerId: sellerId, category: oldCategory);

        var dto = new UpdateListingDto
        {
            Title = "Title updated",
            Description = "Updated",
            Price = 21m,
            Condition = "fair",
            CategoryName = "electronics",
        };
        _repo.Setup(r => r.GetByIdTrackedAsync(listing.ListingId)).ReturnsAsync((listing));
        _repo
            .Setup(r => r.ResolveByNameAsync("electronics", It.IsAny<CancellationToken>()))
            .ReturnsAsync((newCategory));

        var result = await _sut.UpdateListings(
            dto,
            listing.ListingId,
            sellerId,
            CancellationToken.None
        );

        Assert.True(result);
        Assert.Equal(newCategory.CategoryId, listing.CategoryId);
    }

    [Fact]
    public async Task UpdateListings_ThrowsArgumentException_WhenChangingToNonBookCategoryWithBookDetails()
    {
        var sellerId = Guid.NewGuid();
        var oldCategory = new ListingCategory { CategoryId = 1, Name = "book" };
        var newCategory = new ListingCategory { CategoryId = 2, Name = "electronics" };

        var listing = AListing(sellerId: sellerId, category: oldCategory);
        listing.BookDetails = new BookDetails
        {
            ListingId = listing.ListingId,
            Isbn = "268384627283",
            Author = "Some. Auth",
            Edition = "2nd",
        };
        var dto = new UpdateListingDto
        {
            Title = "Title updated",
            Description = "Updated",
            Price = 21m,
            Condition = "fair",
            CategoryName = "electronics",
            BookDetails = new BookDetailsDto
            {
                Isbn = "268384627283",
                Author = "Some_New. Auth",
                Edition = "2nd",
            },
        };
        _repo.Setup(r => r.GetByIdTrackedAsync(listing.ListingId)).ReturnsAsync((listing));
        _repo
            .Setup(r => r.ResolveByNameAsync("electronics", It.IsAny<CancellationToken>()))
            .ReturnsAsync((newCategory));

        var e = await Assert.ThrowsAsync<ArgumentException>(() =>
            _sut.UpdateListings(dto, listing.ListingId, sellerId, CancellationToken.None)
        );

        Assert.Equal("book_fields_not_allowed", e.Message);
    }

    [Fact]
    public async Task UpdateListings_UpdatesMetadata_WhenValidMetadataProvided()
    {
        var sellerId = Guid.NewGuid();
        var listing = AListing(sellerId: sellerId);
        var metadata = JsonDocument.Parse("{\"key\": \"value\"}").RootElement;

        var dto = new UpdateListingDto
        {
            Title = "Title updated",
            Description = "Updated",
            Price = 21m,
            Condition = "fair",
            Metadata = metadata,
        };
        _repo.Setup(r => r.GetByIdTrackedAsync(listing.ListingId)).ReturnsAsync((listing));

        var result = await _sut.UpdateListings(
            dto,
            listing.ListingId,
            sellerId,
            CancellationToken.None
        );

        Assert.True(result);
        Assert.NotNull(listing.Metadata);
        Assert.Contains("\"key\":\"value\"", listing.Metadata);
    }

    [Fact]
    public async Task UpdateListings_DeletesImages_WhenRemovedImageIdsProvided()
    {
        var sellerId = Guid.NewGuid();
        var listing = AListing(sellerId: sellerId);
        var imageIds = new List<int> { 1, 2 };

        var dto = new UpdateListingDto
        {
            Title = "Title now updated",
            Description = "Updated",
            Price = 21m,
            Condition = "fair",
            RemovedImageIds = imageIds,
        };
        _repo.Setup(r => r.GetByIdTrackedAsync(listing.ListingId)).ReturnsAsync((listing));

        var result = await _sut.UpdateListings(
            dto,
            listing.ListingId,
            sellerId,
            CancellationToken.None
        );

        Assert.True(result);
        foreach (var imageId in imageIds)
        {
            _imageRepo.Verify(
                x => x.DeleteAsync(imageId, It.IsAny<CancellationToken>()),
                Times.Once
            );
        }
    }

    [Fact]
    public async Task UpdateListings_ThrowsArgumentException_WhenValidMetadataIsInvalid()
    {
        var sellerId = Guid.NewGuid();
        var listing = AListing(sellerId: sellerId);
        var malformedMetadata = JsonDocument.Parse("[9]").RootElement;

        var dto = new UpdateListingDto
        {
            Title = "Title updated",
            Description = "Updated",
            Price = 21m,
            Condition = "fair",
            Metadata = malformedMetadata,
        };
        _repo.Setup(r => r.GetByIdTrackedAsync(listing.ListingId)).ReturnsAsync((listing));

        var e = await Assert.ThrowsAsync<ArgumentException>(() =>
            _sut.UpdateListings(dto, listing.ListingId, sellerId, CancellationToken.None)
        );

        Assert.Equal("invalid_metadata", e.Message);
    }

    [Fact]
    public async Task UpdateListings_ThrowsArgumentException_WhenCategoryNameNotFound()
    {
        var sellerId = Guid.NewGuid();
        var listing = AListing(sellerId: sellerId);

        var dto = new UpdateListingDto
        {
            Title = "Title updated",
            Description = "Updated",
            Price = 21m,
            Condition = "fair",
            CategoryName = "electronics-a",
        };
        _repo.Setup(r => r.GetByIdTrackedAsync(listing.ListingId)).ReturnsAsync((listing));
        _repo
            .Setup(r => r.ResolveByNameAsync("electronics-a", It.IsAny<CancellationToken>()))
            .ReturnsAsync((ListingCategory?)null);

        var e = await Assert.ThrowsAsync<ArgumentException>(() =>
            _sut.UpdateListings(dto, listing.ListingId, sellerId, CancellationToken.None)
        );

        Assert.Equal("invalid_category", e.Message);
    }

    [Fact]
    public async Task UpdateListings_ThrowsArgumentException_WhenMetadataIsInvalid()
    {
        var sellerId = Guid.NewGuid();
        var listing = AListing(sellerId: sellerId);
        var malformedMetadata = JsonDocument.Parse("[9]").RootElement;
        var dto = new UpdateListingDto
        {
            Title = "TestListing ipad",
            Description = "Good TestListing ipad description",
            Price = 212m,
            Condition = "good",
            Metadata = malformedMetadata,
        };

        _repo.Setup(r => r.GetByIdTrackedAsync(listing.ListingId)).ReturnsAsync(listing);

        var e = await Assert.ThrowsAsync<ArgumentException>(() =>
            _sut.UpdateListings(dto, listing.ListingId, sellerId, CancellationToken.None)
        );

        Assert.Equal("invalid_metadata", e.Message);
    }

    [Fact]
    public async Task UpdateListings_ThrowsArgumentException_WhenBookFieldsOnNonBook()
    {
        var sellerId = Guid.NewGuid();
        var category = new ListingCategory { CategoryId = 1, Name = "electronics" };
        var listing = AListing(sellerId: sellerId, category: category);

        var dto = new UpdateListingDto
        {
            Title = "Title updated",
            Description = "Updated",
            Price = 21m,
            Condition = "fair",
            BookDetails = new BookDetailsDto { Isbn = "23454324943" },
        };
        _repo.Setup(r => r.GetByIdTrackedAsync(listing.ListingId)).ReturnsAsync((listing));

        var e = await Assert.ThrowsAsync<ArgumentException>(() =>
            _sut.UpdateListings(dto, listing.ListingId, sellerId, CancellationToken.None)
        );
        Assert.Equal("book_fields_not_allowed", e.Message);
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

        var result = await _sut.DeleteListings(id, Guid.NewGuid());

        Assert.False(result);
        _repo.Verify(r => r.DeleteByIdAsync(It.IsAny<Guid>()), Times.Never);
    }

    [Fact]
    public async Task DeleteListings_ThrowsUnauthorizedAccessException_WhenNotOwner()
    {
        var sellerId = Guid.NewGuid();
        var callerId = Guid.NewGuid();
        var listing = AListing(sellerId: sellerId);

        _repo.Setup(r => r.GetByIdAsync(listing.ListingId)).ReturnsAsync((listing));

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _sut.DeleteListings(listing.ListingId, callerId)
        );
    }

    [Fact]
    public async Task DeleteListings_DeletesListing_WhenOwner()
    {
        var sellerId = Guid.NewGuid();
        var listing = AListing(sellerId: sellerId);

        _repo.Setup(r => r.GetByIdAsync(listing.ListingId)).ReturnsAsync((listing));

        var result = await _sut.DeleteListings(listing.ListingId, sellerId);

        Assert.True(result);
        _repo.Verify(r => r.DeleteByIdAsync(listing.ListingId), Times.Once);
    }

    [Fact]
    public async Task IsOwnerAsync_ReturnsTrue_WhenUserIsOwner()
    {
        var listingId = Guid.NewGuid();
        var sellerId = Guid.NewGuid();
        _repo.Setup(r => r.IsOwnerAsync(listingId, sellerId)).ReturnsAsync((true));

        var result = await _sut.IsOwnerAsync(listingId, sellerId);

        Assert.True(result);
    }

    [Fact]
    public async Task IsOwnerAsync_ReturnsFalse_WhenUserIsNotOwner()
    {
        var listingId = Guid.NewGuid();
        var sellerId = Guid.NewGuid();
        _repo.Setup(r => r.IsOwnerAsync(listingId, sellerId)).ReturnsAsync((false));

        var result = await _sut.IsOwnerAsync(listingId, sellerId);

        Assert.False(result);
    }

    [Fact]
    public async Task ListAsync_PassesFilterToRepository_Unchanged()
    {
        var filter = new ListFilterDto { Search = "chemistry", ListingType = "book" };
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

    [Fact]
    public async Task CreateListings_ThrowsArgumentException_WhenCategoryNotFound()
    {
        var dto = new CreateListingDto
        {
            Title = "TestListing",
            Description = "Good TestListing",
            Price = 20m,
            Condition = "good",
            CategoryName = "invalid-category",
        };

        _repo
            .Setup(r => r.ResolveByNameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ListingCategory?)null);

        var e = await Assert.ThrowsAsync<ArgumentException>(() =>
            _sut.CreateListings(dto, Guid.NewGuid())
        );
        Assert.Equal("invalid_category", e.Message);
    }

    [Fact]
    public async Task CreateListings_CreatesBookListing_WithBookDetails()
    {
        var category = new ListingCategory { CategoryId = 29, Name = "book" };
        var dto = new CreateListingDto
        {
            Title = "TestListing",
            Description = "Good TestListing",
            Price = 210m,
            Condition = "good",
            CategoryName = "book",
            CourseId = 2,
            BookDetails = new BookDetailsDto
            {
                Isbn = "0-590-76484-5",
                Author = "Rohtua Mbhali",
                Edition = "2nd",
            },
        };

        _repo
            .Setup(r => r.ResolveByNameAsync("book", It.IsAny<CancellationToken>()))
            .ReturnsAsync(category);

        var result = await _sut.CreateListings(dto, Guid.NewGuid());

        Assert.NotNull(result);
        _repo.Verify(
            r =>
                r.AddAsync(
                    It.Is<Listing>(l =>
                        l.CategoryId == category.CategoryId
                        && l.CourseId == 2
                        && l.BookDetails != null
                        && l.BookDetails.Isbn == "0-590-76484-5"
                        && l.BookDetails.Author == "Rohtua Mbhali"
                    )
                ),
            Times.Once
        );
    }

    [Fact]
    public async Task CreateListings_ThrowsArgumentException_WhenBookFieldsOnNonBookCategory()
    {
        var category = new ListingCategory { CategoryId = 29, Name = "electronics" };
        var dto = new CreateListingDto
        {
            Title = "TestListing ipad",
            Description = "Good TestListing ipad description",
            Price = 212m,
            Condition = "good",
            CategoryName = "electronics",
            CourseId = 29,
            BookDetails = new BookDetailsDto
            {
                Isbn = "0-590-76484-5",
                Author = "Rohtua Mbhali",
                Edition = "2nd",
            },
        };

        _repo
            .Setup(r => r.ResolveByNameAsync("electronics", It.IsAny<CancellationToken>()))
            .ReturnsAsync(category);

        var e = await Assert.ThrowsAsync<ArgumentException>(() =>
            _sut.CreateListings(dto, Guid.NewGuid())
        );
        Assert.Equal("book_fields_not_allowed", e.Message);
    }

    [Fact]
    public async Task CreateListings_ThrowsArgumentException_WhenMetadataIsInvalid()
    {
        var category = new ListingCategory { CategoryId = 29, Name = "book" };
        var dto = new CreateListingDto
        {
            Title = "TestListing ipad",
            Description = "Good TestListing ipad description",
            Price = 212m,
            Condition = "good",
            CategoryName = "book",
            CourseId = 29,
            Metadata = JsonDocument.Parse("[9,5]").RootElement,
        };

        _repo
            .Setup(r => r.ResolveByNameAsync("book", It.IsAny<CancellationToken>()))
            .ReturnsAsync(category);

        var e = await Assert.ThrowsAsync<ArgumentException>(() =>
            _sut.CreateListings(dto, Guid.NewGuid())
        );
        Assert.Equal("invalid_metadata", e.Message);
    }

    [Fact]
    public async Task CreateListings_ThrowsArgumentException_WhenMetadataIsNull()
    {
        var category = new ListingCategory { CategoryId = 29, Name = "electronics" };
        var dto = new CreateListingDto
        {
            Title = "TestListing ipad",
            Description = "Good TestListing ipad description",
            Price = 212m,
            Condition = "good",
            CategoryName = "electronics",
            Metadata = JsonDocument.Parse("null").RootElement,
        };

        _repo
            .Setup(r => r.ResolveByNameAsync("electronics", It.IsAny<CancellationToken>()))
            .ReturnsAsync(category);

        var result = await _sut.CreateListings(dto, Guid.NewGuid());
        Assert.NotNull(result);

        _repo.Verify(r => r.AddAsync(It.Is<Listing>(l => l.Metadata == null)), Times.Once);
    }

    // Mapping to summary
    [Fact]
    public async Task GetByIdAsync_MapToSummary_HandlesNullMetadata()
    {
        var listing = AListing();
        listing.Metadata = null;
        _repo.Setup(r => r.GetByIdAsync(listing.ListingId)).ReturnsAsync((listing));

        var result = await _sut.GetByIdAsync(listing.ListingId);
        Assert.Null(result!.Metadata);
    }

    [Fact]
    public async Task GetByIdAsync_MapToSummary_ParsesValidMetadata()
    {
        var listing = AListing();
        var json = "{\"key\": \"value\"}";
        listing.Metadata = json;
        _repo.Setup(r => r.GetByIdAsync(listing.ListingId)).ReturnsAsync((listing));

        var result = await _sut.GetByIdAsync(listing.ListingId);

        Assert.NotNull(result!.Metadata);
        Assert.Equal(JsonValueKind.Object, result.Metadata.Value.ValueKind);
    }

    [Fact]
    public async Task GetByIdAsync_MapToSummary_OrdersImagesByPrimary()
    {
        var listing = AListing();
        listing.Images = new List<ListingImage>
        {
            new ListingImage { ImageId = 1, IsPrimary = false },
            new ListingImage { ImageId = 2, IsPrimary = true },
            new ListingImage { ImageId = 3, IsPrimary = false },
        };
        _repo.Setup(r => r.GetByIdAsync(listing.ListingId)).ReturnsAsync((listing));

        var result = await _sut.GetByIdAsync(listing.ListingId);
        Assert.Equal(2, result!.Images[0].ImageId);
        Assert.Equal(2, result.Images.Count(i => !i.IsPrimary));
    }

    [Fact]
    public void ListingImage_DefaultIsPrimary_IsFalse()
    {
        var image = new ListingImage();
        Assert.False(image.IsPrimary);
    }

    [Fact]
    public void ListingImage_Properties_SetAndGet()
    {
        var listingId = Guid.NewGuid();
        var imageData = new byte[] { 1, 2, 3, 4, 5 };
        var uploadedAt = DateTime.UtcNow;

        var image = new ListingImage
        {
            ImageId = 20,
            ListingId = listingId,
            ImageData = imageData,
            ContentType = "image/png",
            FileSize = 1023,
            IsPrimary = true,
            UploadedAt = uploadedAt,
        };

        Assert.Equal(20, image.ImageId);
        Assert.Equal(listingId, image.ListingId);
        Assert.Equal(imageData, image.ImageData);
        Assert.Equal("image/png", image.ContentType);
        Assert.Equal(1023, image.FileSize);
        Assert.True(image.IsPrimary);
        Assert.Equal(uploadedAt, image.UploadedAt);
    }

    [Fact]
    public void ListingImage_MultipleImages_CanHaveDifferentPrimaryFlags()
    {
        var images = new List<ListingImage>
        {
            new() { ImageId = 1, IsPrimary = false },
            new() { ImageId = 2, IsPrimary = true },
            new() { ImageId = 3, IsPrimary = false },
        };

        Assert.Single(images, i => i.IsPrimary);
        Assert.Equal(2, images.Count(i => !i.IsPrimary));
    }

    [Fact]
    public async Task GetByIdAsync_MapToSummary_HandlesNullBookDetails()
    {
        var listing = AListing();
        listing.BookDetails = null;
        _repo.Setup(r => r.GetByIdAsync(listing.ListingId)).ReturnsAsync((listing));

        var result = await _sut.GetByIdAsync(listing.ListingId);

        Assert.Null(result!.BookDetails);
    }

    // Seller Info
    [Fact]
    public void SellerInfo_Constructor_SetPropertiesCorrectly()
    {
        var userId = Guid.NewGuid();
        var userName = "Thandah";
        var lastName = "Cawe";

        var sellerInfo = new SellerInfo(userId, userName, lastName, null, 0);
        Assert.Equal(userName + " " + lastName, sellerInfo.FullName);
    }

    [Fact]
    public void SellerInfo_HandlesNullNames()
    {
        var userId = Guid.NewGuid();
        var sellerInfo = new SellerInfo(userId, string.Empty, string.Empty, null, 0);

        Assert.Empty(sellerInfo.FullName);
    }

    [Fact]
    public void ListingSummaryDto_Constructor_SetsAllProperties()
    {
        var listingId = Guid.NewGuid();
        var sellerId = Guid.NewGuid();
        var createdAt = DateTime.UtcNow;
        var updatedAt = DateTime.UtcNow;
        var images = new List<ListingImageDto>
        {
            new ListingImageDto(1, "/api/listings/img/1", true),
        };

        var dto = new ListingSummaryDto(
            ListingId: listingId,
            SellerId: sellerId,
            Title: "title",
            Description: "description",
            Price: 300m,
            Condition: "good",
            ListingStatus: "live",
            IsBundle: false,
            ViewCount: 0,
            CreatedAt: createdAt,
            UpdatedAt: updatedAt,
            CategoryId: 1,
            CategoryName: "book",
            CourseId: 110,
            BookDetails: null,
            Metadata: null,
            Images: images,
            Seller: null
        );

        Assert.Equal(listingId, dto.ListingId);
        Assert.Equal(sellerId, dto.SellerId);
        Assert.Equal("title", dto.Title);
        Assert.Equal("description", dto.Description);
        Assert.Equal(300m, dto.Price);
        Assert.Equal("good", dto.Condition);
        Assert.Equal(110, dto.CourseId);
        Assert.Equal(1, dto.CategoryId);
        Assert.Equal("book", dto.CategoryName);
        Assert.Null(dto.Metadata);
        Assert.Null(dto.BookDetails);
        Assert.Equal("live", dto.ListingStatus);
        Assert.False(dto.IsBundle);
        Assert.Equal(updatedAt, dto.UpdatedAt);
        Assert.Equal(0, dto.ViewCount);
        Assert.Equal(createdAt, dto.CreatedAt);
        Assert.Single(dto.Images);
    }

    [Theory]
    [InlineData("live", "draft")]
    [InlineData("live", "removed")]
    [InlineData("draft", "live")]
    [InlineData("draft", "removed")]
    [InlineData("removed", "live")]
    public async Task UpdateStatusAsync_AllowsSellerTransitions_BetweenOpenStatuses(
        string from,
        string to
    )
    {
        var seller = Guid.NewGuid();
        var listing = AListing(
            sellerId: seller,
            images: new List<ListingImage> { new() { ImageId = 1 } }
        );
        listing.ListingStatus = from;
        _repo.Setup(r => r.GetByIdTrackedAsync(listing.ListingId)).ReturnsAsync(listing);

        var result = await _sut.UpdateStatusAsync(listing.ListingId, seller, to);

        Assert.True(result);
        Assert.Equal(to, listing.ListingStatus);
        _repo.Verify(r => r.SaveAsync(), Times.Once);
    }

    [Theory]
    [InlineData("reserved")]
    [InlineData("sold")]
    [InlineData("pending")]
    [InlineData("rejected")]
    [InlineData("low_visibility")]
    [InlineData("random_listing_status")]
    public async Task UpdateStatusAsync_ThrowsInvalidStatus_WhenStatusIsNotSellerSettable(
        string status
    )
    {
        var listing = AListing();
        listing.ListingStatus = "live";

        var exception = await Assert.ThrowsAsync<ArgumentException>(() =>
            _sut.UpdateStatusAsync(listing.ListingId, listing.SellerId, status)
        );
        Assert.Equal("invalid_status", exception.Message);
        _repo.Verify(r => r.GetByIdTrackedAsync(It.IsAny<Guid>()), Times.Never);
    }

    [Theory]
    [InlineData("reserved")]
    [InlineData("sold")]
    [InlineData("pending")]
    [InlineData("rejected")]
    public async Task UpdateStatusAsync_ThrowsStatusLocked_WhenCurrentStatusIsLocked(
        string currStatus
    )
    {
        var seller = Guid.NewGuid();
        var listing = AListing(
            sellerId: seller,
            images: new List<ListingImage> { new() { ImageId = 1 } }
        );
        listing.ListingStatus = currStatus;
        _repo.Setup(r => r.GetByIdTrackedAsync(listing.ListingId)).ReturnsAsync(listing);

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _sut.UpdateStatusAsync(listing.ListingId, listing.SellerId, "live")
        );
        Assert.Equal("status_locked", exception.Message);
        _repo.Verify(r => r.SaveAsync(), Times.Never);
    }

    [Fact]
    public async Task UpdateStatusAsync_ThrowsForbidden_WhenNotOwner()
    {
        var sellerId = Guid.NewGuid();
        var listing = AListing(sellerId: sellerId);
        listing.ListingStatus = "live";
        _repo.Setup(r => r.GetByIdTrackedAsync(listing.ListingId)).ReturnsAsync((listing));

        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _sut.UpdateStatusAsync(listing.ListingId, Guid.NewGuid(), "draft")
        );
        Assert.Equal("forbidden", exception.Message);
    }

    [Fact]
    public async Task UpdateStatusAsync_RejectsListingToGoLive_WhenNoImages()
    {
        var seller = Guid.NewGuid();
        var listing = AListing(
            sellerId: seller,
            description: "listing with a description",
            images: new List<ListingImage>()
        );
        listing.ListingStatus = "draft";
        _repo.Setup(r => r.GetByIdTrackedAsync(listing.ListingId)).ReturnsAsync((listing));

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _sut.UpdateStatusAsync(listing.ListingId, seller, "live")
        );
        Assert.Equal("images_required", exception.Message);
        _repo.Verify(r => r.SaveAsync(), Times.Never);
    }

    [Theory]
    [InlineData("")]
    [InlineData("  ")]
    public async Task UpdateStatusAsync_RejectsListingToGoLive_WhenBlackDescription(string blank)
    {
        var seller = Guid.NewGuid();
        var listing = AListing(
            sellerId: seller,
            description: blank,
            images: new List<ListingImage> { new() { ImageId = 1 } }
        );

        listing.ListingStatus = "draft";
        _repo.Setup(r => r.GetByIdTrackedAsync(listing.ListingId)).ReturnsAsync((listing));

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _sut.UpdateStatusAsync(listing.ListingId, seller, "live")
        );
        Assert.Equal("description_required", exception.Message);
        _repo.Verify(r => r.SaveAsync(), Times.Never);
    }

    [Fact]
    public async Task UpdateStatusAsync_ToDraft_AllowedWhenNoImages()
    {
        var seller = Guid.NewGuid();
        var listing = AListing(sellerId: seller, images: new List<ListingImage>());
        listing.ListingStatus = "live";
        _repo.Setup(r => r.GetByIdTrackedAsync(listing.ListingId)).ReturnsAsync((listing));

        var result = await _sut.UpdateStatusAsync(listing.ListingId, seller, "draft");
        Assert.True(result);
        Assert.Equal("draft", listing.ListingStatus);
    }

    [Fact]
    public async Task UpdateStatusAsync_ListingGoesLive_WhenImagesAndDescriptionPresent()
    {
        var seller = Guid.NewGuid();
        var listing = AListing(
            sellerId: seller,
            description: "Describing listing",
            images: new List<ListingImage> { new() { ImageId = 1 } }
        );
        listing.ListingStatus = "draft";
        _repo.Setup(r => r.GetByIdTrackedAsync(listing.ListingId)).ReturnsAsync((listing));

        var result = await _sut.UpdateStatusAsync(listing.ListingId, seller, "live");
        Assert.True(result);
        Assert.Equal("live", listing.ListingStatus);
        _repo.Verify(r => r.SaveAsync(), Times.Once);
    }

    [Fact]
    public async Task UpdateStatusAsync_ToRemoved_AllowedWhenNoImagesOrDescription()
    {
        var seller = Guid.NewGuid();
        var listing = AListing(sellerId: seller, description: "", images: new List<ListingImage>());
        listing.ListingStatus = "live";
        _repo.Setup(r => r.GetByIdTrackedAsync(listing.ListingId)).ReturnsAsync((listing));

        var result = await _sut.UpdateStatusAsync(listing.ListingId, seller, "removed");
        Assert.True(result);
        Assert.Equal("removed", listing.ListingStatus);
    }

    private static Listing AListing(
        string title = "Sample",
        string description = "desc",
        decimal price = 100m,
        string condition = "good",
        Guid? sellerId = null,
        ListingCategory? category = null,
        List<ListingImage>? images = null
    ) =>
        new()
        {
            ListingId = Guid.NewGuid(),
            SellerId = sellerId ?? Guid.NewGuid(),
            Title = title,
            Description = description,
            Price = price,
            Condition = condition,
            ListingStatus = "live",
            IsBundle = false,
            ViewCount = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Category = category ?? new ListingCategory { CategoryId = 1, Name = "book" },
            CategoryId = category?.CategoryId ?? 1,
            BookDetails = null,
            Metadata = null,
            Images = images ?? new List<ListingImage>(),
        };
}
