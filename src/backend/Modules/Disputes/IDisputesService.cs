using Modules.Disputes.Models.Dto;

public interface IDisputeService
{
    Task<IReadOnlyList<CaseSummaryDto>> ListPendingAsync(
        string? type,
        CancellationToken ct = default
    );
    Task<DisputeCaseData?> GetCaseDataAsync(Guid disputeId, CancellationToken ct = default);
}
