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

    Task<IReadOnlyList<CaseNoteDto>> GetNotesAsync(Guid caseId, CancellationToken ct = default);
    Task<CaseNoteDto> AddNoteAsync(Guid caseId, Guid adminId, string content, CancellationToken ct = default);
    Task StrikeUserAsync(
        Guid userId,
        Guid? caseId,
        string reason,
        Guid adminId,
        CancellationToken ct = default
    );

     Task<CaseDetailDto?> GetCaseByIdForUserAsync(Guid caseId, Guid userID, CancellationToken ct = default);


}
