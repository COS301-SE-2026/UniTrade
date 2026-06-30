namespace Modules.Identity.Models;

public class AdminProfile
{
    public Guid AdminId { get; set; }
    public Guid UserId { get; set; }
    public int UniversityId { get; set; }

    public User User { get; set; } = null!;
}
