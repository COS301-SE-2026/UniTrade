using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Mail;
using System.Security.Claims;
using System.Text; //for encoding
using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Primitives;
using Microsoft.IdentityModel.Tokens;
using Modules.Identity;
using Modules.Identity.Models;
using Modules.Identity.Models.Dto;
using Modules.Identity.Models.DTO;
using Modules.Identity.Repositories;
using Modules.Listings.Repositories;
using Modules.ReferenceData;
using Modules.ReferenceData.University;
using Modules.ReferenceData.University.Repositories;

namespace Modules.Identity;

public sealed class IdentityException(string code) : Exception(code) { }

public class IdentityService : IIdentityService
{
    private readonly IUserRepository _users;
    private readonly IUniversityRepository _universities;

    private readonly IListingRepository _listings;
    private readonly IConfiguration _config;

    private const string StudentRole = "student";
    private const string PendingStatus = "pending";

    public IdentityService(
        IUserRepository users,
        IUniversityRepository universities,
        IListingRepository listing,
        IConfiguration config
    )
    {
        _users = users;
        _universities = universities;
        _listings = listing;
        _config = config;
    }

    public async Task<User> RegisterAsync(RegisterDto dto)
    {
        //check password strength
        if (!IsPasswordStrong(dto.Password))
        {
            throw new IdentityException("weak_password");
        }

        // check email format
        if (!IsValidEmailFormat(dto.Email))
        {
            throw new IdentityException("invalid_email");
        }

        var normalisedEmail = NormaliseEmail(dto.Email.Trim().ToLowerInvariant());

        normalisedEmail = normalisedEmail
            .Replace("\u3002", ".")
            .Replace("\uff0e", ".")
            .Replace("\uff61", ".");

        var emailParts = normalisedEmail.Split('@');

        if (emailParts.Length != 2)
        {
            throw new IdentityException("invalid_email");
        }
        var studentNumber = emailParts[0];
        var domain = emailParts[1].ToLowerInvariant();

        try
        {
            domain = new IdnMapping().GetAscii(domain);
        }
        catch (ArgumentException)
        {
            throw new IdentityException("invalid_domain");
        }
        if (dto.YearOfStudy < 1 || dto.YearOfStudy > 10)
        {
            throw new IdentityException("invalid_year_of_study");
        }

        var university = await _universities.GetByDomainAsync(domain);
        if (university == null)
        {
            throw new IdentityException("invalid_domain");
        }
        // Check if user already exists
        var existingUser = await _users.GetByEmailAsync(normalisedEmail);

        if (existingUser != null)
        {
            var currentStatus = existingUser.StudentProfile?.VerificationStatus;

            throw currentStatus switch
            {
                "verified" => new IdentityException("email_taken"),
                PendingStatus => new IdentityException("otp_already_sent"),
                _ => new IdentityException("email_taken"),
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
            Role = StudentRole,

            StudentProfile = new StudentProfile
            {
                UniversityId = university.UniversityId,
                StudentNumber = studentNumber,
                YearOfStudy = dto.YearOfStudy,
                DegreeProgram = dto.DegreeProgram,
                VerificationStatus = "pending",
                SellerTrustScore = 0,
                BuyerReliabilityScore = 0,
            },
        };

        try
        {
            await _users.AddAsync(user);
        }
        catch (DbUpdateException)
        {
            throw new IdentityException("email_taken");
        }

        return user;
    }

    public async Task<User?> GetUserByEmailAsync(string email)
    {
        return await _users.GetByEmailAsync(NormaliseEmail(email.Trim().ToLowerInvariant()));
    }

    private static bool IsPasswordStrong(string? password)
    {
        if (string.IsNullOrWhiteSpace(password) || password.Length < 8)
        {
            return false;
        }
        return password.Any(char.IsUpper)
            && password.Any(char.IsLower)
            && password.Any(char.IsDigit)
            && password.Any(ch => !char.IsLetterOrDigit(ch));
    }

    private static bool IsValidEmailFormat(string? email)
    {
        if (string.IsNullOrWhiteSpace(email) || email.Length > 254)
        {
            return false;
        }

        email = NormaliseEmail(email);

        if (!TryParseEmail(email, out string? local, out string? domain))
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(local) || string.IsNullOrWhiteSpace(domain))
        {
            return false;
        }

        //ip literal support
        if (!IsValidDomain(domain))
        {
            return false;
        }

        if (!IsValidLocalPart(local))
        {
            return false;
        }

        return true;
    }

    private static bool TryParseEmail(string email, out string? local, out string? domain)
    {
        local = null;
        domain = null;

        try
        {
            var address = new MailAddress(email);

            if (address.Address != email.Trim())
            {
                return false;
            }
        }
        catch
        {
            return false;
        }

        var parts = email.Split('@');
        if (parts.Length != 2)
        {
            return false;
        }

        local = parts[0];
        domain = NormaliseDomain(parts[1]);
        return true;
    }

    private static bool IsValidIdnaDomain(string domain)
    {
        var idn = new IdnMapping();
        try
        {
            idn.GetAscii(domain);
            return true;
        }
        catch
        {
            return false;
        }
    }

    private static bool IsValidLocalPart(string local)
    {
        if (Encoding.UTF8.GetByteCount(local) > 64)
        {
            return false;
        }
        if (!local.StartsWith('\"') && local.Contains(".."))
        {
            return false;
        }
        return true;
    }

    private static bool IsValidIpLiteral(string domain)
    {
        var inner = domain[1..^1];

        if (inner.StartsWith("IPv6", StringComparison.OrdinalIgnoreCase))
        {
            return IPAddress.TryParse(inner[5..], out var addr)
                && addr.AddressFamily == System.Net.Sockets.AddressFamily.InterNetworkV6;
        }

        return IPAddress.TryParse(inner, out var ipv4)
            && ipv4.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork;
    }

    private static bool IsValidDomain(string domain)
    {
        if (domain.StartsWith('[') && domain.EndsWith(']'))
        {
            return IsValidIpLiteral(domain);
        }

        if (Encoding.UTF8.GetByteCount(domain) > 255)
        {
            return false;
        }
        var labels = domain.Split('.');
        if (labels[^1].All(char.IsDigit))
        {
            return false;
        }

        return IsValidIdnaDomain(domain);
    }

    public static string NormaliseEmail(string email)
    {
        email = email.Replace("\uff20", "@");

        //strip invisible chars
        var ignore = new HashSet<char> { '\u00ad', '\u200b', '\u2060', '\ufeff' };

        var cleaned = new string(email.Where(c => !ignore.Contains(c)).ToArray());

        return cleaned.Normalize(NormalizationForm.FormC);
    }

    public static string NormaliseDomain(string domain)
    {
        foreach (var sep in new[] { "\u3002", "\uff0e", "\uff61" })
        {
            domain = domain.Replace(sep, ".");
        }
        return domain.Normalize();
        //nfc nromalisation
    }

    //main method
    public async Task<string> LoginAsync(LoginDto loginDto)
    {
        if (
            string.IsNullOrWhiteSpace(loginDto.Email)
            || string.IsNullOrWhiteSpace(loginDto.Password)
        )
        {
            // BecauseMiddle ware throws exceptions
            throw new IdentityException("invalid_credentials");
        }

        //*user here follows User Model not schema
        var user = await _users.GetByEmailAsync(NormaliseEmail(loginDto.Email.Trim().ToLowerInvariant()));
        //tasks: query db, verify password and get email, gen. token, then return a response
        if (user == null || user.IsDeleted)
        {
            throw new IdentityException("invalid_credentials");
        }

        if (!BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
        {
            throw new IdentityException("invalid_credentials");
        }
        string verificationStatus;

        if (user.Role == StudentRole)
        {
            if (user.StudentProfile != null)
            {
                verificationStatus = user.StudentProfile.VerificationStatus ?? PendingStatus;
            }
            else
            {
                verificationStatus = PendingStatus;
            }
        }
        else
        {
            verificationStatus = PendingStatus;
        }

        return TokenGenerator(user, verificationStatus);
    }

    private string TokenGenerator(User user, string? verificationStatus = null)
    {
        var secret =
            _config["Jwt:Secret"]
            ?? throw new InvalidOperationException("Jwt__Secret is not configured");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));

        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        //data that goes inside token, like an id card
        var claims = new List<Claim>
        {
            new Claim("sub", user.UserId.ToString()),
            new Claim("email", user.Email),
            new Claim("role", user.Role),
        };

        if (user.Role == StudentRole)
        {
            claims.Add(new Claim("verification_status"!, verificationStatus!));
        }

        //blueprint for the token(form)
        var token = new JwtSecurityToken(
            claims: claims,
            signingCredentials: credentials,
            expires: DateTime.UtcNow.AddHours(24)
        );
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public async Task<object> GetMeAsync(string userId)
    {
        var getUser = await _users.GetByIdAsync(Guid.Parse(userId));

        if (getUser == null)
        {
            throw new IdentityException("not_found");
        }

        if (getUser.Role == StudentRole)
        {
            //make a student dto
            return new
            {
                User = new UserDto
                {
                    UserId = getUser.UserId,
                    FirstName = getUser.FirstName,
                    LastName = getUser.LastName,
                    Email = getUser.Email,
                    UserRole = getUser.Role,
                },
                //I didn't follow the response you wanted zee, i made it nested instead. hopefully not a problem
                Std = new StudentDto
                {
                    VerificationStatus =
                        getUser.StudentProfile?.VerificationStatus ?? PendingStatus,
                    DegreeProgram = getUser.StudentProfile?.DegreeProgram ?? string.Empty,
                    YearOfStudy = getUser.StudentProfile?.YearOfStudy ?? 1,
                    University = getUser.StudentProfile?.University?.Name ?? string.Empty,
                    SellerTrustScore = getUser.StudentProfile?.SellerTrustScore?? 0,
                    BuyerReliabilityScore = getUser.StudentProfile?.BuyerReliabilityScore?? 0,
                    
                },
            };
        }

        return new UserDto
        {
            UserId = getUser.UserId,
            FirstName = getUser.FirstName,
            LastName = getUser.LastName,
            Email = getUser.Email,
        };
    }

    public async Task<object> UpdateProfileAsync(string userId, UpdateProfileDto dto)
    {
        var user = await _users.GetByIdAsync(Guid.Parse(userId));

        if (user == null)
        {
            throw new IdentityException("not_found");
        }
        if (dto.YearOfStudy < 1 || dto.YearOfStudy > 8)
        {
            throw new IdentityException("invalid_year_of_study");
        }
        if (string.IsNullOrWhiteSpace(dto.DegreeProgram))
        {
            throw new IdentityException("degree_program_required");
        }
        user.FirstName = dto.FirstName;
        user.LastName = dto.LastName;
        user.UpdatedAt = DateTime.UtcNow;

        if (user.StudentProfile != null)
        {
            user.StudentProfile.YearOfStudy = dto.YearOfStudy;
            user.StudentProfile.DegreeProgram = dto.DegreeProgram;
        }
        await _users.UpdateAsync(user);

        return new
        {
            message = "Profile updated successfully",
            user = new
            {
                user.FirstName,
                user.LastName,
                user.Email,
                user.UserId,
            },
            profile = new
            {
                user.StudentProfile?.YearOfStudy,
                user.StudentProfile?.DegreeProgram,
                user.StudentProfile?.VerificationStatus,
            },
        };
    }

    public async Task DeleteAccountAsync(string userId)
    {
        var user = await _users.GetByIdAsync(Guid.Parse(userId));
        if (user == null)
        {
            throw new IdentityException("not_found");
        }

        user.IsDeleted = true;
        user.DeletedAt = DateTime.UtcNow;
        user.Email = $"deleted_{user.UserId}@unitrade.com";
        await _users.UpdateAsync(user);

        await _listings.MarkAllBySellerAsRemovedAsync(
            Guid.Parse(userId),
            "User deleted their account"
        );
    }
}
