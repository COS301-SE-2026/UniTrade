using Modules.Disputes.Models.Dto;
using Modules.Disputes.Repositories;

namespace Modules.Disputes;

public class DisputesService : IDisputeService
{
    //private readonly IDisputeRepository _disputes; // @Sabira : put this guard when you implement it ...

    // public DisputesService(IDisputeRepository disputes) => _disputes = disputes;

    public Task<IReadOnlyList<CaseSummaryDto>> ListPendingAsync(
        string? type,
        CancellationToken ct = default
    )
    {
        // return _disputes.ListPendingAsync(type, ct); // where status in open , or under review order by the created at
        return Task.FromResult<IReadOnlyList<CaseSummaryDto>>(Array.Empty<CaseSummaryDto>());
    }

    public Task<DisputeCaseData?> GetCaseDataAsync(Guid disputeId, CancellationToken ct = default)
    {
        //return _disputes.GetCaseDataAsync(disputeId, ct);
        return Task.FromResult<DisputeCaseData?>(null);
    }
}
