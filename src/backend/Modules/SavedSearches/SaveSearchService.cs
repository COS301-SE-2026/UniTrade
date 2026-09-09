using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Modules.Identity.Repositories;
using Modules.Listings;
using Modules.Listings.Models.Dto;
using Modules.Notifications;
using Modules.Reservations;
using Modules.SavedSearches.Models;
using Modules.SavedSearches.Models.Dto;
using Modules.SavedSearches.Repositories;

namespace Modules.SavedSearches;

public class SavedSearchService : IListingPublishedListener, ISavedSearchService
{
    private readonly ISavedSearchRepository _repo;
    private readonly INotificationDispatcher _notifications;
    private readonly IBroadCastService _broadcast;
    private readonly IEmailService _emailService;
    private readonly IUserRepository _userRepo;
    private readonly ILogger<SavedSearchService> _logger;

    public SavedSearchService(
        ISavedSearchRepository repo,
        INotificationDispatcher notifications,
        IBroadCastService broadcast,
        IEmailService emailService,
        IUserRepository userRepo,
        ILogger<SavedSearchService> logger
    )
    {
        _repo = repo;
        _notifications = notifications;
        _broadcast = broadcast;
        _emailService = emailService;
        _logger = logger;
        _userRepo = userRepo;
    }

    public async Task OnListingPublishedEventAsync(
        ListingPublishedEvent listingEvent,
        CancellationToken ct
    )
    {
        try
        {
            if (_logger.IsEnabled(LogLevel.Information))
            {
                _logger.LogInformation("Listing published: {Title}", listingEvent.Title);
            }
            using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            timeoutCts.CancelAfter(TimeSpan.FromSeconds(30));
            var tokenTimeout = timeoutCts.Token;

            var candidates = await _repo.GetCandidatesForListingAsync(listingEvent, tokenTimeout);
            if (_logger.IsEnabled(LogLevel.Information))
            {
                _logger.LogInformation("Found {Count} candidates", candidates.Count);
            }
            var stck = $"{listingEvent.Title} {listingEvent.Description ?? ""}";

            var matching = new List<SavedSearch>();
            foreach (var candidate in candidates)
            {
                tokenTimeout.ThrowIfCancellationRequested();
                if (IsExactWordMatch(candidate.Query, stck, tokenTimeout))
                    matching.Add(candidate);
            }

            foreach (var search in matching)
            {
                var msg =
                    $"New listing matches your search: {listingEvent.Title}- R{listingEvent.Price:F2}";
                await _notifications.NotifyAsync(search.BuyerId, "saved_search", msg, ct);

                await _broadcast.SendToUserAsync(
                    search.BuyerId,
                    "saved_search_match",
                    new
                    {
                        listingId = listingEvent.ListingId,
                        title = listingEvent.Title,
                        price = listingEvent.Price,
                        message = msg,
                    }
                );

                try
                {
                    var user = await _userRepo.GetByIdAsync(search.BuyerId);
                    var email = user?.Email;
                    if (!string.IsNullOrEmpty(email))
                    {
                        await _emailService.SendSavedSearchMatchEmailAsync(
                            email,
                            listingEvent.Title,
                            listingEvent.Price
                        );
                    }
                }
                catch (Exception emailEx)
                {
                    _logger.LogWarning(
                        emailEx,
                        "Failed to send email for buyer {BuyerId}",
                        search.BuyerId
                    );
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Saved search notification failed for listing {ListingId}",
                listingEvent.ListingId
            );
        }
    }

    public async Task<SavedSearchDto> CreateAsync(
        Guid buyerId,
        CreateSavedSearchDto dto,
        CancellationToken ct
    )
    {
        var search = new SavedSearch
        {
            BuyerId = buyerId,
            Query = dto.Query,
            CategoryId = dto.CategoryId,
            MinPrice = dto.MinPrice,
            MaxPrice = dto.MaxPrice,
            CourseId = dto.CourseId,
            IsActive = true,
        };
        var saved = await _repo.AddAsync(search, ct);
        return MapToDto(saved);
    }

    public async Task<IReadOnlyList<SavedSearchDto>> GetByBuyerAsync(
        Guid buyerId,
        CancellationToken ct
    )
    {
        var searches = await _repo.GetByBuyerAsync(buyerId, ct);
        return searches.Select(MapToDto).ToList();
    }

    public async Task DeleteAsync(Guid searchId, Guid buyerId, CancellationToken ct)
    {
        var search = await _repo.GetByIdAsync(searchId, ct);
        if (search == null || search.BuyerId != buyerId)
        {
            throw new InvalidOperationException(
                "Saved search not found or does not belong to you."
            );
        }
        await _repo.DeleteAsync(searchId, ct);
    }

    private static bool IsExactWordMatch(string query, string stck, CancellationToken ct)
    {
        var words = query.Split(' ', StringSplitOptions.RemoveEmptyEntries).Select(Regex.Escape);
        foreach (var word in words)
        {
            ct.ThrowIfCancellationRequested();

            if (
                !Regex.IsMatch(
                    stck,
                    $@"\b{word}\b",
                    RegexOptions.IgnoreCase,
                    TimeSpan.FromSeconds(1)
                )
            )
                return false;
        }
        return true;
    }

    private static SavedSearchDto MapToDto(SavedSearch s) =>
        new()
        {
            SearchId = s.SearchId,
            Query = s.Query,
            CategoryId = s.CategoryId,
            MinPrice = s.MinPrice,
            MaxPrice = s.MaxPrice,
            CourseId = s.CourseId,
            IsActive = s.IsActive,
        };

    public async Task<IReadOnlyList<ListingSummaryDto>> GetMatchingListingAsync(
        Guid searchId,
        Guid buyerId,
        CancellationToken ct
    )
    {
        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeoutCts.CancelAfter(TimeSpan.FromSeconds(30));
        var tokenTimeout = timeoutCts.Token;

        var search = await _repo.GetByIdAsync(searchId, tokenTimeout);
        if (search == null || search.BuyerId != buyerId || !search.IsActive)
        {
            throw new InvalidOperationException(
                "Saved search not found or does not belong to you."
            );
        }

        var listings = await _repo.GetMatchingListingsAsync(search, tokenTimeout);

        return listings.Select(ListingService.MapToSummary).ToList();
    }
}
