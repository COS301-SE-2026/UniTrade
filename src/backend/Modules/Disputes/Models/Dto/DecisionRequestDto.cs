namespace Modules.Disputes.Models.Dto;

public class DecisionRequestDto
{
    public string Decision { get; set; } = null!;
    public string[]? Outcomes { get; set; }
    public string? Reason { get; set; }
}
