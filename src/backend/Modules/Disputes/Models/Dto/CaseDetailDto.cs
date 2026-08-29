namespace Modules.Disputes.Models.Dto;

public class CaseDetailDto : CaseSummaryDto
{
    public PartySummaryDto? Subject { get; set; }
    public PartySummaryDto? CounterParty { get; set; }
    public CaseEvidenceDto Evidence { get; set; } = new();
    public object[] History { get; set; } = Array.Empty<object>();
    public Guid? FiledByUserId { get; set; }
    public string FiledByRole { get; set; } = "";
}
