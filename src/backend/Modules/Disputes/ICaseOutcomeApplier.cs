namespace Modules.Disputes;

public sealed record CaseOutcomeContext(
    Guid CaseId,
    Guid SubjectUserId,
    Guid? ListingId,
    Guid AdminId,
    string? Reason,
    string Scope = "seller",
    Guid? CounterpartyUserId = null
);

public interface ICaseOutcomeApplier
{
    Task ApplyAsync(
        IReadOnlyList<DisputeOutcome> outcomes,
        CaseOutcomeContext context,
        CancellationToken ct = default
    );
}
