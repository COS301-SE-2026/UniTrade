namespace Modules.Reviews;

// for sonarqube purposes because it won't stop b**kig

public sealed class ReviewException(string code) : Exception(code) { }

public static class ReviewErrors
{
    public const string NotAParty = "not_a_party";
    public const string TransactionNotFound = "transaction_not_found";
    public const string TransactionNotComplete = "transaction_not_complete";
    public const string AlreadyReviewed = "already_reviewed";
    public const string InvalidRating = "invalid_rating";
    public const string SelfReview = "self_review";
}
