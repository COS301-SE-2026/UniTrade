using Modules.Disputes.Models.Dto;

namespace Modules.Disputes;

public interface IDisputesService
{
    Task<FileDisputeResultDto> FileDisputeAsync(FileDisputeDto req, Guid filedByUserId, CancellationToken ct = default);
}
