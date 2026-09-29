using Modules.Disputes.Models;
namespace Modules.Disputes.Repositories;

public interface ICaseNoteRepository
{
    Task<IReadOnlyList<CaseNote>> ListByCaseIdAsync(Guid caseId, CancellationToken ct = default);
    Task<CaseNote> AddAsync(Guid caseId, Guid authorAdminId, string content, CancellationToken ct = default);
}
