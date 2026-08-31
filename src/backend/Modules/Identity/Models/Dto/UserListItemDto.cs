namespace Modules.Identity.Models.Dto;

public class UserListItemDto
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = null;
    public string Email { get; set; } = null;
    public string Degree { get; set; } = null;
    public int Year { get; set; }
    public string VerificationStatus { get; set; } = null;
    public double ReviewAverage { get; set; }
    public int StrikeCount { get; set; }
}

public class ListUsersResponseDto
{
    public List<UserListItemDto> Users { get; set; } = new();
    public int Total { get; set; }
}
