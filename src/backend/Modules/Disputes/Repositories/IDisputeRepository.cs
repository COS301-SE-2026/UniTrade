using Modules.Disputes.Models.Dto;
using Modules.Disputes;
using Modules.Disputes.Models;

namespace Modules.Disputes.Repositories;

public interface IDisputeRepository
{
    Task<IReadOnlyList<CaseSummaryDto>> ListPendingAsync(
        string? type,
        CancellationToken ct = default
    );
    Task<DisputeCaseData?> GetCaseDataAsync(Guid disputeId, CancellationToken ct = default);
    Task<Guid> CreateDisputeAsync(Dispute dispute, CancellationToken ct = default);

    Task MarkResolvedAsync(Guid disputeId, Guid adminId, string resolution, CancellationToken ct = default);
    Task<bool> HasOpenDisputeAsync(Guid filedByUserId, Guid subjectUserId, CancellationToken ct = default);

}
