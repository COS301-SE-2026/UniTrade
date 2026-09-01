using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Modules.SavedSearches.Models.Dto;

namespace Modules.SavedSearches;

public interface ISavedSearchService
{
    Task<SavedSearchDto> CreateAsync(Guid buyerId, CreateSavedSearchDto dto, CancellationToken ct);
    Task<IReadOnlyList<SavedSearchDto>> GetByBuyerAsync(Guid buyerId, CancellationToken ct);
    Task DeleteAsync(Guid searchId, Guid buyerId, CancellationToken ct);
}
