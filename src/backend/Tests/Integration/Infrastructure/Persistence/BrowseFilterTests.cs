using System.Threading.Tasks;
using Api.Tests.Integration;
using Docker.DotNet.Models;
using Infrastructure.Persistence;
using Infrastructure.Persistence.Repositories.Listings;
using Xunit;

namespace UniTrade.Tests.Integration.Persistence;

[Trait("Category", "Integration")]
[Collection("DatabaseCollection")]
public sealed class BrowseFilterTests
{
    private readonly DbFixture _fixture;

    public BrowseFilterTests(DbFixture fixture) => _fixture = fixture;

    private static ListingRepository Repo(AppDbContext context) => new(context);

    [Fact]
    public async Task ListAsync_ExcludesRemovedListings_EvenWithoutTheStatusFilter()
    {
        var seller = await _fixture.CreateUserAsync();
        var liveListing = await _fixture.AListingAsync(sellerId: seller, status: "live");
        var removedListing = await _fixture.AListingAsync(sellerId: seller, status: "removed");

        await using var context = _fixture.CreateContext();
        var (items, total) = await Repo(context)
            .ListAsync(new Modules.Listings.Models.Dto.ListFilterDto { SellerId = seller });

        Assert.Equal(1, total);
        Assert.Contains(items, l => l.ListingId == liveListing);
        Assert.DoesNotContain(items, l => l.ListingId == removedListing);
    }

    [Fact]
    public async Task ListAsync_ExcludesListings_FromDeletedSellers()
    {
        var deletedSeller = await _fixture.CreateUserAsync(deleted: true);
        await _fixture.AListingAsync(sellerId: deletedSeller, status: "live");

        await using var context = _fixture.CreateContext();
        var (items, total) = await Repo(context)
            .ListAsync(new Modules.Listings.Models.Dto.ListFilterDto { SellerId = deletedSeller });
        Assert.Equal(0, total);
        Assert.Empty(items);
    }

    [Fact]
    public async Task ListAsync_ExcludesSeller_WhenExlcudeSellerIdSet()
    {
        var seller1 = await _fixture.CreateUserAsync();
        var seller2 = await _fixture.CreateUserAsync();

        var listedBy1 = await _fixture.AListingAsync(sellerId: seller1);
        var listedBy2 = await _fixture.AListingAsync(sellerId: seller2);

        await using var context = _fixture.CreateContext();
        var (items, _) = await Repo(context)
            .ListAsync(new Modules.Listings.Models.Dto.ListFilterDto { ExcludeSellerId = seller1 });

        Assert.DoesNotContain(items, l => l.ListingId == listedBy1);
        Assert.Contains(items, l => l.ListingId == listedBy2);
    }

    [Fact]
    public async Task ListAsync_FilterByStatus()
    {
        var seller = await _fixture.CreateUserAsync();
        var liveListing = await _fixture.AListingAsync(sellerId: seller, status: "live");
        var draft = await _fixture.AListingAsync(sellerId: seller, status: "draft");

        await using var context = _fixture.CreateContext();
        var (items, total) = await Repo(context)
            .ListAsync(
                new Modules.Listings.Models.Dto.ListFilterDto
                {
                    SellerId = seller,
                    ListingStatus = "live",
                }
            );

        Assert.Equal(1, total);
        Assert.Contains(items, l => l.ListingId == liveListing);
        Assert.DoesNotContain(items, l => l.ListingId == draft);
    }

    [Fact]
    public async Task ListAsync_FiltersBySeller()
    {
        var seller1 = await _fixture.CreateUserAsync();
        var seller2 = await _fixture.CreateUserAsync();

        var listedBy1 = await _fixture.AListingAsync(sellerId: seller1);
        var listedBy2 = await _fixture.AListingAsync(sellerId: seller2);

        await using var context = _fixture.CreateContext();
        var (items, _) = await Repo(context)
            .ListAsync(new Modules.Listings.Models.Dto.ListFilterDto { SellerId = seller1 });

        Assert.Contains(items, l => l.ListingId == listedBy1);
        Assert.DoesNotContain(items, l => l.ListingId == listedBy2);
    }

    [Fact]
    public async Task ListAsync_Paginates_TotalCountsAllMatchesFound()
    {
        var seller = await _fixture.CreateUserAsync();
        for (var i = 0; i < 5; i++)
        {
            await _fixture.AListingAsync(sellerId: seller);
        }

        await using var context = _fixture.CreateContext();

        var (page1, total1) = await Repo(context)
            .ListAsync(
                new Modules.Listings.Models.Dto.ListFilterDto
                {
                    SellerId = seller,
                    Skip = 0,
                    Take = 2,
                }
            );
        Assert.Equal(2, page1.Count);
        Assert.Equal(5, total1);

        var (lastPage, total2) = await Repo(context)
            .ListAsync(
                new Modules.Listings.Models.Dto.ListFilterDto
                {
                    SellerId = seller,
                    Skip = 4,
                    Take = 2,
                }
            );

        Assert.Single(lastPage);
        Assert.Equal(5, total2);
    }
}
