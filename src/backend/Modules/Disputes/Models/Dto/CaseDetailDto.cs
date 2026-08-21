namespace Modules.Disputes.Models.Dto;

public class CaseDetailDto : CaseSummaryDto
{
    public VerificationEvidenceDto? Evidence { get; set; }
    public object[] History { get; set; } = Array.Empty<object>();
}
