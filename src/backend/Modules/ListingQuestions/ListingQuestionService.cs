using Modules.Identity;
using Modules.ListingQuestions.Models;
using Modules.ListingQuestions.Repositories;
using Modules.Notifications;
using Modules.Reservations;

namespace Modules.ListingQuestions;

public sealed class ListingQuestionException(string code) : Exception(code) { }

public class ListingQuestionService : IListingQuestionService
{
    private readonly IListingQuestionRepository _repo;
    private readonly IListingQueryForQuestions _listing;
    private readonly INotificationDispatcher _notification;
    private readonly IBroadCastService _broadCast;
    private readonly IPartyDirectory _parties;

    public ListingQuestionService(
        IListingQuestionRepository repo,
        IListingQueryForQuestions listing,
        IBroadCastService broadCast,
        INotificationDispatcher notification,
        IPartyDirectory parties
    )
    {
        _repo = repo;
        _listing = listing;
        _notification = notification;
        _broadCast = broadCast;
        _parties = parties;
    }

    public async Task<IReadOnlyList<ListingQuestionDto>> GetForListingAsync(
        Guid listingId,
        CancellationToken ct = default
    )
    {
        var rows = await _repo.GetByListingAsync(listingId, ct);

        var dtos = new List<ListingQuestionDto>(rows.Count);
        foreach (var question in rows)
        {
            dtos.Add(await MapAsync(question, ct));
        }
        return dtos;
    }

    public async Task<ListingQuestionDto> AskAsync(
        Guid listingId,
        Guid askerId,
        string questionText,
        CancellationToken ct = default
    )
    {
        if (string.IsNullOrWhiteSpace(questionText))
            throw new ListingQuestionException("empty_question");

        var info =
            await _listing.GetForQuestionsAsync(listingId, ct)
            ?? throw new ListingQuestionException("listing_not_found");

        if (!info.IsLive)
            throw new ListingQuestionException("listing_not_found");

        if (info.SellerId == askerId)
            throw new ListingQuestionException("cannot_question_own_listing");

        var query = await _repo.AddAsync(
            new ListingQuestion
            {
                ListingId = listingId,
                AskerId = askerId,
                QuestionText = questionText.Trim(),
            },
            ct
        );

        var dto = await MapAsync(query, ct);

        await _notification.NotifyAsync(
            info.SellerId,
            "listing_question",
            $"New question on your listing: \"{Truncate(query.QuestionText, 60)}\"",
            ct
        );
        await _broadCast.SendToUserAsync(
            info.SellerId,
            "listing_question_asked",
            new { listingId, questionId = query.QuestionId }
        );

        return dto;
    }

    public async Task<ListingQuestionDto> AnswerAsync(
        Guid questionId,
        Guid callerId,
        string answerText,
        CancellationToken ct = default
    )
    {
        if (string.IsNullOrWhiteSpace(answerText))
            throw new ListingQuestionException("empty_answer");

        var query =
            await _repo.GetByIdTrackedAsync(questionId, ct)
            ?? throw new ListingQuestionException("question_not_found");
        var info =
            await _listing.GetForQuestionsAsync(query.ListingId, ct)
            ?? throw new ListingQuestionException("listing_not_found");

        if (info.SellerId != callerId)
            throw new ListingQuestionException("not_seller");

        if (query.AnswerText != null)
            throw new ListingQuestionException("already_answered");

        query.AnswerText = answerText.Trim();
        query.AnsweredAt = DateTime.UtcNow;

        await _repo.SaveAsync(ct);

        var dto = await MapAsync(query, ct);

        await _notification.NotifyAsync(
            query.AskerId,
            "listing_question",
            "The seller answered your question.",
            ct
        );
        await _broadCast.SendToUserAsync(
            query.AskerId,
            "listing_question_answered",
            new
            {
                listingId = query.ListingId,
                questionId = query.QuestionId,
                dto,
            }
        );

        return dto;
    }

    private async Task<ListingQuestionDto> MapAsync(ListingQuestion lq, CancellationToken ct)
    {
        var identity = await _parties.GetAsync(lq.AskerId, ct);
        var initials = identity != null ? $"{identity.FirstName[0]}{identity.LastName[0]}" : "?";

        return new ListingQuestionDto
        {
            QuestionId = lq.QuestionId,
            ListingId = lq.ListingId,
            QuestionText = lq.QuestionText,
            AnswerText = lq.AnswerText,
            AskedAt = lq.AskedAt,
            AnsweredAt = lq.AnsweredAt,
            AskerInitials = initials ?? "?",
        };
    }

    private static string Truncate(string s, int n) => s.Length <= n ? s : s[..n] + "...";
}
