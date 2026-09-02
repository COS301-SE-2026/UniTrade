using System;

namespace Modules.ListingQuestions.Models;

public class ListingQuestionDto
{
    public Guid QuestionId { get; set; }
    public Guid ListingId { get; set; }
    public string QuestionText { get; set; } = null!;
    public string? AnswerText { get; set; }
    public DateTime AskedAt { get; set; }
    public DateTime? AnsweredAt { get; set; }
    public string AskerInitials { get; set; } = null;
    public bool IsAnswered => AnswerText != null;
}
