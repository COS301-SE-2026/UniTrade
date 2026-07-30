using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Modules.Listings.Models;
using Xunit;

namespace Api.Tests.Integration.Infrastructure.Storage;

[Trait("Category", "Integration")]
[Collection("DatabaseCollection")]

public sealed class ImageStorageTests
{
    private readonly DbFixture _fixture;

    public ImageStorageTests(DbFixture fixture) => _fixture = fixture;

    [Theory]
    [InlineData(1)]
    [InlineData(1024)]
    [InlineData(64 * 1024)]
    [InlineData(1024 * 1024)]
    public async Task ImageData_RoundTripsWithoutModification(int size)
    {
        var listingId = await _fixture.AListingAsync();

        var og = new byte[size];
        Random.Shared.NextBytes(og);
        const string contentType = "image/png";

        int imageId;

        await using (var db = _fixture.CreateContext())
        {
            var image = new ListingImage
            {
                ListingId = listingId,
                ImageData = og,
                ContentType = contentType,
                FileSize = og.Length,
                IsPrimary = true,
            };
            db.ListingImages.Add(image);
            await db.SaveChangesAsync();
            imageId = image.ImageId;
        }

        await using (var verifying = _fixture.CreateContext())
        {
            var entry = await verifying
                .ListingImages.AsNoTracking()
                .SingleAsync(i => i.ImageId == imageId);

            Assert.Equal(og, entry.ImageData);
            Assert.Equal(contentType, entry.ContentType);
            Assert.Equal(size, entry.FileSize);
        }
    }

    [Fact]
    public async Task EmptyImageData_IsNotMaterialisedAsNull()
    {
        var listingId = await _fixture.AListingAsync();

        int imageId;

        await using (var db = _fixture.CreateContext())
        {
            var image = new ListingImage
            {
                ListingId = listingId,
                ImageData = Array.Empty<byte>(),
                ContentType = "application/octet-stream",
                FileSize = 0,
                IsPrimary = false,
            };
            db.ListingImages.Add(image);
            await db.SaveChangesAsync();
            imageId = image.ImageId;
        }

        await using (var verifying = _fixture.CreateContext())
        {
            var entry = await verifying
                .ListingImages.AsNoTracking()
                .SingleAsync(i => i.ImageId == imageId);

            Assert.NotNull(entry.ImageData);
            Assert.Empty(entry.ImageData);
        }
    }
}
