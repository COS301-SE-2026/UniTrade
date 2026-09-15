using Modules.Disputes.Models.Dto;

namespace Modules.Disputes;

public interface IDisputeService
{
    Task<FileDisputeResultDto> FileDisputeAsync(
        FileDisputeDto req,
        Guid filedByUserId,
        CancellationToken ct = default
    );

    Task<IReadOnlyList<CaseSummaryDto>> ListPendingAsync(
        string? type,
        CancellationToken ct = default
    );
    Task<DisputeCaseData?> GetCaseDataAsync(Guid disputeId, CancellationToken ct = default);
    Task MarkResolvedAsync(
        Guid disputeId,
        Guid adminId,
        string status,
        CancellationToken ct = default
    );
}
