namespace Modules.Disputes.Models.Dto;

public sealed class PartySummaryDto
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = "";
    public string Initials { get; set; } = "";
    public string? Faculty { get; set; }
    public double ReviewAverage { get; set; }
    public decimal ReputationScore { get; set; }
    public int StrikeCount { get; set; }
}

