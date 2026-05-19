using Modules.Notifications;
using Modules.Identity.Models.Dto;
using Modules.Identity.Models;
using Modules.ReferenceData.University;
using Modules.Identity.Repositories;
using Modules.Identity;
using System.Net.Mail;
using Microsoft.EntityFrameworkCore;

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
        //check password strength
        if (!IsPasswordStrong(dto.Password))
        {   
            throw new Exception("weak_password");
        }

        // check email format 
        if (!IsValidEmailFormat(dto.Email))
        {
            throw new Exception("invalid_email");
        }

        var normalisedEmail = dto.Email.Trim().ToLowerInvariant();

        var emailParts = normalisedEmail.Split('@');

        if (emailParts.Length != 2)
        {
            throw new Exception("invalid_email");
        }
        var studentNumber = emailParts[0];
        var domain = emailParts[1].ToLower();


        if (dto.YearOfStudy < 1 || dto.YearOfStudy > 10)
        {
            throw new Exception("invalid_year_of_study");
        }

        var university = await _universities.GetByDomainAsync(domain);
        if (university == null)
        {
            throw new Exception("invalid_domain");
        }
        // Check if user already exists
        var existingUser = await _users.GetByEmailAsync(normalisedEmail);

        if (existingUser != null)
        {
            var currentStatus = existingUser.StudentProfile?.VerificationStatus;

            throw currentStatus switch
            {
                "verified" => new Exception("email_taken"),
                "pending" => new Exception("otp_already_sent"),
                _ => new Exception("email_taken")

            };

        }



        // hash password
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

        // create new user
        var user = new User
        {
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Email = normalisedEmail,
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

        try
        {
            await _users.AddAsync(user);

        }
        catch (DbUpdateException)
        {
            throw new Exception("email_taken");
        }

        return user;
    }
    public async Task<User?> GetUserByEmailAsync(string email)
    {
        return await _users.GetByEmailAsync(email.Trim().ToLowerInvariant());

    }
    private static bool IsPasswordStrong(string? password)
    {

        if (string.IsNullOrWhiteSpace(password) || password.Length < 8)
        {
            return false;
        }
        return password.Any(char.IsUpper) && password.Any(char.IsLower) && password.Any(char.IsDigit) && password.Any(ch => !char.IsLetterOrDigit(ch));
    }
    private static bool IsValidEmailFormat(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return false;
        }
        try
        {
            var address = new MailAddress(email);
            var parts = email.Split('@');
            return address.Address == email && parts.Length == 2 && !string.IsNullOrWhiteSpace(parts[0]) && !string.IsNullOrWhiteSpace(parts[1]);
        }
        catch
        {
            return false;
        }
    }
}
