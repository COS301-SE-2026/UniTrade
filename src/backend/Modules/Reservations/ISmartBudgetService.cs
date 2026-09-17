using Modules.Listings.Repositories;
using Modules.Reservations.Models.Dto;

namespace Modules.Reservations;

public interface ISmartBudgetService
{
    Task<SmartBudgetPreviewDto> PreviewAsync(IReadOnlyList<Guid> listingId, decimal maxbudget, CancellationToken ct = default);
    //Task<SmartBudgetBatchResultDto> ReserveAsync(Guid buyerId,IReadOnlyList<Guid> listingIds, decimal maxbudget, CancellationToken ct=default);
}
