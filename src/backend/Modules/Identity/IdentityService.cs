using Modules.Notifications;
using Modules.Identity.Models.Dto;
using Modules.Identity.Models;
using Modules.ReferenceData.University;
using Modules.Identity.Repositories;
using Modules.Identity;

public class IdentityService : IIdentityService
{
    private readonly IUserRepository _users;
    private readonly INotificationsService _notifications;
    private readonly IUniversityRepository _universities;
    public IdentityService(IUserRepository users, INotificationsService notifications, IUniversityRepository universities)
    {
        _users = users;
        _notifications = notifications;
        _universities = universities;
    }

    public async Task<User> RegisterAsync(RegisterDto dto)
    {
        // Check if user already exists
        var existingUser = await _users.GetByEmailAsync(dto.Email);

        if (existingUser != null)
        {
            var currentStatus = existingUser.StudentProfile?.VerificationStatus;

            if (currentStatus == "verified")
                throw new Exception("email_taken");

            if (currentStatus == "pending")
                throw new Exception("otp_already_sent");
        }
        var emailParts = dto.Email.Split('@');

        if(emailParts.Length != 2)
        {
            throw new Exception("invalid_email");
        }
        var domain = emailParts[1].ToLower();
        var university = await _universities.GetByDomainAsync(domain);

        var studentNumber = emailParts[0];
        if (university == null)
        {
            throw new Exception("invalid_domain");
        }
        // hash password
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

        // create new user
        var user = new User
        {
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Email = dto.Email,
            PhoneNumber = dto.PhoneNumber ?? "",
            PasswordHash = passwordHash,
            Role = "student",

            StudentProfile = new StudentProfile
            {
                UniversityId = university.UniversityId,
                StudentNumber = studentNumber,
                YearOfStudy = dto.YearOfStudy,
                VerificationStatus = "pending",
                ReputationScore = 0

            }
        };

        await _users.AddAsync(user);

        return user;
    }
    public async Task<User?> GetUserByEmailAsync(string email)
    {
        return await _users.GetByEmailAsync(email);

    }
}
