using Modules.Listings.Models;
using Modules.Listings.Models.Dto;
using Modules.Listings.Repositories;
using Modules.SharedKernel;
using System.Text.Json;

namespace Modules.Listings;

public class ListingService : IListingService
{
    private readonly IListingRepository _listings;

    private readonly IListingImageRepository _images;


    public ListingService(IListingRepository listings, IListingImageRepository images)
    {
        _listings = listings;
        _images = images;
    }

    public async Task<ListingSummaryDto?> GetByIdAsync(Guid listingId)
    {
        var listing = await _listings.GetByIdAsync(listingId);
        return listing == null ? null : MapToSummary(listing);
    }

    public async Task<PagedResult<ListingSummaryDto>> ListAsync(ListFilterDto filter)
    {
        var (items, total) = await _listings.ListAsync(filter);
        return new PagedResult<ListingSummaryDto>(items.Select(MapToSummary).ToList(), total);
    }

    private ListingSummaryDto MapToSummary(Listing l) =>
        new(
            ListingId:l.ListingId,
            SellerId:l.SellerId,
            Title:l.Title,
            Description:l.Description,
            Price:l.Price,
            Condition:l.Condition,
            CourseId:l.CourseId,
            CategoryId:l. CategoryId,
            CategoryName:l.Category?.Name ?? string.Empty,
            Metadata: string.IsNullOrEmpty(l.Metadata)
                ?null
                : JsonDocument.Parse(l.Metadata).RootElement,
            BookDetails: l.BookDetails is null
                ? null
                : new BookDetailsDto
                {
                    Isbn=l.BookDetails.Isbn,
                    Author=l.BookDetails.Author,
                    Edition=l.BookDetails.Edition
                },
            ListingStatus:l.ListingStatus,
            IsBundle:l.isBundle ?? false,
            ViewCount:l.ViewCount ?? 0,
            CreatedAt:l.CreatedAt,
            UpdatedAt:l.UpdatedAt,
            Images:l.Images.OrderByDescending(i => i.IsPrimary)
                .Select(i => new ListingImageDto(
                    i.ImageId,
                    $"/api/listings/{l.ListingId}/images/{i.ImageId}",
                    i.IsPrimary
                ))
                .ToList()
        );

    public async Task<ListingSummaryDto> CreateListings(CreateListingDto dto, Guid callerId)
    {
        //resolve category
        var category= await _listings.ResolveByNameAsync(dto.CategoryName.Trim());
        if(category==null)
        {
            throw new ArgumentException("invalid_category");
        }

        bool isBook=string.Equals(category.Name,"book",StringComparison.OrdinalIgnoreCase);

        if(!isBook&& dto.BookDetails is not null)
        {
            throw new ArgumentException("book_fields_not_allowed_for_category");
        }

        //validate metadaata
        string? metadataJ=null;
        if(dto.Metadata.HasValue && dto.Metadata.Value.ValueKind != System.Text.Json.JsonValueKind.Null)
        {
            metadataJ=System.Text.Json.JsonSerializer.Serialize(dto.Metadata.Value);
        }

        var newListing = new Listing
        {
            Title = dto.Title,
            Description = dto.Description,
            Price = dto.Price,
            Condition = dto.Condition,
            
            SellerId = callerId,
            ListingStatus = dto.ListingStatus,
            ListingId = Guid.NewGuid(),
            CourseId = dto.CourseId,
            isBundle = dto.IsBundle,
            ViewCount = 0,
            Images = new List<ListingImage>(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        await _listings.AddAsync(newListing);

        if(isBook && dto.BookDetails is not null)
        {
            //ValidateBookDetails()
            var newbook= new BookDetails
            {
                ListingId=newListing.ListingId,
                Author = dto.BookDetails.Author,
                Isbn = dto.BookDetails.Isbn,
                Edition = dto.BookDetails.Edition?.Trim()
            };

            newListing.BookDetails=newbook;
            await _listings.SaveAsync();

        }

        return MapToSummary(newListing);
    }

    //!!!!!validations for the bookdetails!!!!

    public async Task<bool> UpdateListings(UpdateListingDto listings, Guid id,Guid callerId, CancellationToken ct= default)
    {
        // updates to text based fields
        var listingLookUp = await _listings.GetByIdTrackedAsync(id);
        if (listingLookUp == null)
            return false;

        if (listingLookUp.SellerId != callerId)
        {
            throw new UnauthorizedAccessException("Only sellers can update listings");
        }

        bool isBook=listingLookUp.Category!=null && string.Equals(listingLookUp.Category.Name,"book",StringComparison.OrdinalIgnoreCase);

        if(!isBook&& listings.BookDetails is not null)
        {
            throw new ArgumentException("book_fields_not_allowed_for_category");
        }

        listingLookUp.Title = listings.Title;
        listingLookUp.Description = listings.Description;
        listingLookUp.Price = listings.Price;
        listingLookUp.Condition = listings.Condition;
        listingLookUp.UpdatedAt = DateTime.UtcNow;
        await _listings.SaveAsync();

        //update metadata
        if(listings.Metadata.HasValue){

        var metadat=listings.Metadata.Value;
        if(metadat.ValueKind!=System.Text.Json.JsonValueKind.Object)
        {
            throw new ArgumentException("invalid_metadata");
        }
        listingLookUp.Metadata=System.Text.Json.JsonSerializer.Serialize(metadat);
        }

        // updates to images

        if (listings.RemovedImageIds is { Count: > 0 })
        {
            foreach (var imageId in listings.RemovedImageIds)
            {
                await _images.DeleteAsync(imageId, ct);
            }
        }

        return true;
    }

    public async Task<bool> DeleteListings(Guid id, Guid callerId)
    {
        var listing = await _listings.GetByIdAsync(id);
        if (listing == null)
            return false;

        if (listing.SellerId != callerId)
        {
            throw new UnauthorizedAccessException("Only sellers can delete listings");
        }

        foreach (var image in listing.Images)
        {
            await _images.DeleteAsync(image.ImageId); //this delet only has an interface???
        }

        await _listings.DeleteByIdAsync(id);
        return true;
    }
}
