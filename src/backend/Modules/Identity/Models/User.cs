using System.Runtime.CompilerServices;

namespace Modules.Identity.Models;

public class User
{
    public Guid UserId { get; set; }
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? PhoneNumber { get; set; }
    public string PasswordHash { get; set; } = null!;
    public string Role { get; set; } = null!; // admin or student
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public DateTime? TermsAcceptedAt { get; set; }
    public StudentProfile? StudentProfile { get; set; }
    public AdminProfile? AdminProfile { get; set; }
}
