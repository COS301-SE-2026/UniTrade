using Modules.Disputes;
using Modules.Disputes.Models;
using Modules.Disputes.Models.Dto;

namespace Modules.Disputes.Repositories;

public interface IDisputeRepository
{
    Task<IReadOnlyList<CaseSummaryDto>> ListPendingAsync(
        string? type,
        CancellationToken ct = default
    );
    Task<DisputeCaseData?> GetCaseDataAsync(Guid disputeId, CancellationToken ct = default);
    Task<Guid> CreateDisputeAsync(Dispute dispute, CancellationToken ct = default);

    Task MarkResolvedAsync(
        Guid disputeId,
        Guid adminId,
        string resolution,
        CancellationToken ct = default
    );
    Task<bool> HasOpenDisputeAsync(
        Guid filedByUserId,
        Guid subjectUserId,
        Guid? listingId = null,
        CancellationToken ct = default
    );

    Task<Dispute?> GetMostRecentReportDisputeForListingAsync(
        Guid listingId,
        CancellationToken ct = default
    );
    Task SetOriginalSnapshotAsync(Guid disputeId, Guid snapshotId, CancellationToken ct = default);
    Task ReopenAsResubmissionAsync(Guid disputeId, CancellationToken ct = default);
    Task UpdateSnapshotAsync(Guid disputeId, Guid snapshot, CancellationToken ct = default);
    Task<IReadOnlyList<CaseSummaryDto>> ListForUserAsync(Guid userId, string? type, CancellationToken ct = default);

    Task<IReadOnlyList<CaseSummaryDto>> ListClosedAsync(string? type, CancellationToken ct = default);

}
