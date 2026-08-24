using Modules.Disputes.Models.Dto;
#if DISPUTES_READY
using Modules.Disputes.Repositories;
#endif

namespace Modules.Disputes;

public class DisputesService : IDisputeService
{
#if DISPUTES_READY
    private readonly IDisputeRepository _disputes; // @Sabira : put this guard when you implement it ...

    public DisputesService(IDisputeRepository disputes) => _disputes = disputes;
#endif

    public Task<IReadOnlyList<CaseSummaryDto>> ListPendingAsync(
        string? type,
        CancellationToken ct = default
    )
    {
#if DISPUTES_READY
        return _disputes.ListPendingAsync(type, ct); // where status in open , or under review order by the created at
#else
        return Task.FromResult<IReadOnlyList<CaseSummaryDto>>(Array.Empty<CaseSummaryDto>());
#endif
    }

    public Task<DisputeCaseData?> GetCaseDataAsync(Guid disputeId, CancellationToken ct = default)
    {
#if DISPUTES_READY
        return _disputes.GetCaseDataAsync(disputeId, ct);
#else
        return Task.FromResult<DisputeCaseData?>(null);
#endif
    }
}
