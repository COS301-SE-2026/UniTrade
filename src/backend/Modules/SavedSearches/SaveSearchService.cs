using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Modules.SavedSearches.Models;
using Modules.SavedSearches.Models.Dto;
using Modules.Listings;
using Infrastructure.Notifications;
using Infrastructure.SignalR;
using Modules.Users;

namespace Modules.SavedSearches;

public class SavedSearchService: IListingPublishedListener, ISavedSearchService
{
    private readonly ISavedSearchRepository _repo;
    private readonly INotificationDispatcher _notifications;
    private readonly IBroadCastService _broadcast;
    private readonly IEmailService _emailService;
    private readonly IUserReadRepository _userRepo;
    private readonly ILogger<SavedSearchService> _logger;

    public SavedSearchService(ISavedSearchRepository repo, INotificationDispatcher notifications, IBroadCastService broadcast, IEmailService emailService, IUserReadRepository userRepo, ILogger<SavedSearchService> logger)
    {
        _repo=repo;
        _notifications=notifications;
        _broadcast=broadcast;
        _emailService=emailService;
        _logger=logger;
        _userRepo=userRepo;
    }

    public async Task OnListingPublishedEventAsync(ListingPublishedEvent listingEvent, CancellationToken ct)
    {
        try
        {
            var candidates=await _repo.GetCandidatesForListingAsync(listingEvent,ct);
            var stck=$"{listingEvent.Title}{listingEvent.Description ?? ""}".ToLowerInvariant();

            var matching=candidates.Where(s=>
            {
                var words=s.Query.ToLowerInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries);
                return words. All(w=> stck.Contains(w)); /////PSS move this so it doesnt break our magnificent arch!!
            }).ToList();

            foreach(var search in matching)
            {
                var msg=$"New listing matches your search: {listingEvent.Title}- R{listingEvent.Price: F2}";
                await _notifications.NotifyAsync(search.BuyerId, "saved_search",msg,ct);

                await _broadcast.SendToUserAsync(search.BuyerId, "saved_search_match", new{
                    listingId=listingEvent.ListingId,
                    title=listingEvent.Title,
                    price=listingEvent.Price,
                    message=msg
                });

                try{
                    var email=await _userRepo.GetEmailAsync(search.BuyerId,ct);
                    if(!string.IsNullOrEmpty(email))
                    {
                        await _emailService.SendSavedSearchMatchEmailAsync(email,listingEvent.Title, listingEvent.Price);
                    }
                }
                catch(Exception emailEx)
                {
                    _logger.LogWarning(emailEx, "Failed to send email for buyer {BuyerId}", search.BuyerId);
                }
            }
        }
        catch(Exception ex)
        {
            _logger.LogError(ex, "Saved search notification failed for listing {ListingId}", listingEvent);
        }
    }  

    public async Task<SavedSearchDto> CreateAsync(Guid buyerId, CreateSavedSearchDto dto,CancellationToken ct)
    {
        var search=new SavedSearch
        {
            BuyerId=buyerId,
            Query=dto.Query,
            CategoryId=dto.CategoryId,
            MinPrice=dto.MinPrice,
            MaxPrice=dto.MaxPrice,
            CourseId=dto.CourseId,
            IsActive=true,
        };
        var saved=await _repo.AddAsync(search,ct);
        return MapToDto(saved);
    } 

    public async Task<IReadOnlyList<SavedSearchDto>> GetByBuyerAsync(Guid buyerId, CancellationToken ct)
    {
        var searches=await _repo.GetByBuyerAsync(buyerId,ct);
        return searches.Select(MapToDto).ToList();
    }

    public async Task DeleteAsync(Guid searchId, Guid buyerId, CancellationToken ct)
    {
        var search=await _repo.GetByIdAsync(searchId,ct);
        if(search==null || search.BuyerId!=buyerId)
        {
            throw new InvalidOperationException("Saved search not found or does not belong to you.");
        }
        await _repo.DeleteAsync(searchId,ct);
    }

    private static SavedSearchDto MapToDto(SavedSearch s) =>new()
    {
        SearchId=s.SearchId,
        Query=s.Query,
        CategoryId=s.CategoryId,
        MinPrice=s.MinPrice,
        MaxPrice=s.MaxPrice,
        CourseId=s.CourseId,
        IsActive=s.IsActive,
    };
}