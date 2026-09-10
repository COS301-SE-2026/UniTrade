namespace Modules.Disputes.Repositories;

public interface ICaseRepository
{
    Task<Guid> CreateCaseAsync(string caseType, Guid subjectUserId, Guid filedByUserId, string evidenceJson, string? description, CancellationToken ct = default);
}
