using System;

namespace Modules.ListingQuestions.Models;

public class ListingQuestion
{
    public Guid QuestionId { get; set; }
    public Guid ListingId { get; set; }
    public Guid AskerId { get; set; }
    public string QuestionText { get; set; } = null!;
    public string? AnswerText { get; set; }
    public DateTime AskedAt { get; set; }
    public DateTime? AnsweredAt { get; set; }
}
