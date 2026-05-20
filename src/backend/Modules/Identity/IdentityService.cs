using Infrastructure.Persistence;
using Modules.Notifications;
using Modules.Identity.Models;
using Modules.ReferenceData.University;
using Modules.Identity.Repositories;
using Modules.Identity;
using System.Net.Mail;
using Microsoft.EntityFrameworkCore;

using Microsoft.IdentityModel.Tokens;
using System.Text;//for encoding
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using BCrypt.Net;
using Microsoft.Extensions.Configuration;
using Modules.Identity.Models.DTO;

////note for me(sabira)---> make sure to change paths regarding infra 
public class IdentityService : IIdentityService
{
    private readonly IUserRepository _users;
    private readonly INotificationsService _notifications;
    private readonly IUniversityRepository _universities;
    private readonly IConfiguration _config;

    public IdentityService(IUserRepository users, INotificationsService notifications, IUniversityRepository universities, IConfiguration config)
    {
        _users = users;
        _notifications = notifications;
        _universities = universities;
        _config = config;
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

    //main method
    public async Task<string> LoginAsync(LoginDTO loginDto)
    {

        if (string.IsNullOrWhiteSpace(loginDto.Email) || string.IsNullOrWhiteSpace(loginDto.Password))
        {
            /*return new LoginResponse
            {
                Message = "Email and password are required",
                User = null
            };*/
            // BecauseMiddle ware throws exceptions
            throw new Exception("invalid_credentials");

        }

        //*user here follows User Model not schema
        var user = await _users.GetByEmailAsync(loginDto.Email.Trim().ToLowerInvariant());
        //tasks: query db, verify password and get email, gen. token, then return a response
        if (user == null)
        {
            /* return new LoginResponse
             {
                 Message = "Invalid credentials",
                 User = null
             };
             */
            throw new Exception("invalid_credentials");
        }

        if (!BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
        {
            throw new Exception("invalid_credentials");

        }
        string verificationStatus = "n/a";

        if (user.Role == "student")
        {


            if (user.StudentProfile != null)
            { verificationStatus = user.StudentProfile.VerificationStatus ?? "pending"; }

            else
            { verificationStatus = "pending"; }
        }
        else
        {
            verificationStatus = "pending";
        }

        return TokenGenerator(user, verificationStatus);

    }



    private string TokenGenerator(User user, string? verificationStatus = null)
    {
        var secret = _config["Jwt:Secret"] ??
        throw new InvalidOperationException("Jwt__Secret is not configured");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));

        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        //data that goes inside token, like an id card
        var claims = new List<Claim>
        {
            new Claim("sub", user.UserId.ToString()),
            new Claim("email", user.Email),
            new Claim("role", user.Role),
        };

        if (user.Role == "student")
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
        var getUser=await _users.GetByIdAsync(Guid.Parse(userId));

        if(getUser==null)
        {
            throw new Exception("user not found");
        }

        if(getUser.Role=="student")
        {
            //make a student dto
            return new
            {
                User=new UserDto
                {
                    Id=getUser.UserId,
                    FirstName=getUser.FirstName,
                    LastName=getUser.LastName,
                    Email=getUser.Email,
                    Role=getUser.Role
                },
                //i didnt follow the response you wanted zee, i made it nested instead. hopefully not a problem
                Std=new StudentDto
                {
                    VerificationStatus=getUser.StudentProfile?.VerificationStatus ?? "pending"
                }
            };
        }

        return new UserDto
        {
            Id= getUser.UserId,
            FirstName=getUser.FirstName,
            LastName=getUser.LastName,
            Email=getUser.Email,
            Role=getUser.Role
        };
        
    }

}


