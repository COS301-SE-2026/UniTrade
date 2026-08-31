namespace Modules.Identity.Models.Dto;

public class UserReputationDto
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string UniversityName { get; set; } = "";
    public string Degree { get; set; } = "";
    public int Year { get; set; }
    public string VerificationStatus { get; set; }
    public double ReviewAverage { get; set; }
    public int ReputationScore { get; set; }
    public int ReviewCount { get; set; }
    public List<StrikeDto> Strikes { get; set; } = new();
}

public class StrikeDto
{
    public Guid StrikeId { get; set; }
    public string Type { get; set; } = "";
    public string Reason { get; set; } = "";
    public Guid? SourceCaseId { get; set; }
    public Guid CreatedByAdminId { get; set; }
    public DateTime CreatedAt { get; set; }
}
