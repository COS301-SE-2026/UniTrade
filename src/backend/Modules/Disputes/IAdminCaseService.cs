using Modules.Disputes.Models.Dto;

namespace Modules.Disputes;

public interface IAdminCaseService
{
    Task<IReadOnlyList<CaseSummaryDto>> ListCasesAsync(
        string? type,
        string? status,
        CancellationToken ct = default
    );
    Task<CaseDetailDto?> GetCaseByIdAsync(Guid caseId, CancellationToken ct = default);
    Task<CaseDetailDto?> DecideCaseAsync(
        Guid caseId,
        DecisionRequestDto request,
        Guid adminId,
        CancellationToken ct = default
    );
}
