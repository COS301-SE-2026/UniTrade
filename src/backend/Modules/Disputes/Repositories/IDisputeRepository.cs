using Modules.Disputes.Models.Dto;

namespace Modules.Disputes.Repositories;

public interface IDisputeRepository
{
    Task<IReadOnlyList<CaseSummaryDto>> ListPendingAsync(
        string? type,
        CancellationToken ct = default
    );
    Task<DisputeCaseData?> GetCaseDataAsync(Guid disputeId, CancellationToken cy = default);
}
