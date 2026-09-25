using Modules.Timetable.Models.Dto;

namespace Modules.Timetable;

public interface IIcsImportService
{
    Task<ImportPreviewDto> PreviewAsync(Stream icsStream, CancellationToken ct = default);

    Task<ImportCommitResultDto> CommitAsync(
        Guid userId,
        IReadOnlyList<ImportPatternDto> patterns,
        CancellationToken ct = default
    );
}
