namespace Modules.Disputes;

public enum DisputeOutcome
{
    Strike,
    RemoveListing,
    RefusalFlag,
}

public enum DisputeCaseDecision
{
    Approve,
    Reject,
    Resubmit,
    Uphold,
    Dismiss,
    RequestInfo,
}

internal static class DisputeDecisionMappings
{
    public static DisputeCaseDecision Map(string value) =>
        value switch
        {
            "approve" => DisputeCaseDecision.Approve,
            "reject" => DisputeCaseDecision.Reject,
            "resubmit" => DisputeCaseDecision.Resubmit,
            "uphold" => DisputeCaseDecision.Uphold,
            "dismiss" => DisputeCaseDecision.Dismiss,
            "request_info" => DisputeCaseDecision.RequestInfo,
            _ => throw new DisputesException("invalid_decison"),
        };

    public static IReadOnlyList<DisputeOutcome> MappingOutcomes(string[]? values) =>
        (values ?? Array.Empty<string>())
            .Select(v =>
                v switch
                {
                    "strike" => DisputeOutcome.Strike,
                    "remove_listing" => DisputeOutcome.RemoveListing,
                    "refusal_flag" => DisputeOutcome.RefusalFlag,
                    _ => throw new DisputesException("invalid_outcome"),
                }
            )
            .ToList();
}
