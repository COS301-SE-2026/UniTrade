using Modules.Listings.Repositories;
using Modules.Reservations.Models.Dto;

namespace Modules.Reservations;

public interface ISmartBudgetService
{
    Task<SmartBudgetPreviewDto> PreviewAsync(IReadOnlyList<Guid> listingId, decimal maxbudget);
}
