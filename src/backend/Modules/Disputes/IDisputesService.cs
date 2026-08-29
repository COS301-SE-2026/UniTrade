using Modules.Disputes.Models.Dto;

<<<<<<< HEAD
namespace Modules.Disputes;

public interface IDisputesService
{
    Task<FileDisputeResultDto> FileDisputeAsync(FileDisputeDto req, Guid filedByUserId, CancellationToken ct = default);
=======
public interface IDisputeService
{
    Task<IReadOnlyList<CaseSummaryDto>> ListPendingAsync(
        string? type,
        CancellationToken ct = default
    );
    Task<DisputeCaseData?> GetCaseDataAsync(Guid disputeId, CancellationToken ct = default);
>>>>>>> 0b1ed388a3ecfad5ba69f82e1fcc5970bad72528
}
