using API.Modules.Identity.Models.DTO;
using API.Infrastructure.Persistence;

using Microsoft.IdentityModel.Tokens;
using System.Text;//for encoding

using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

namespace API.Modules.Identity
{
public class IdentityService: IIdentityService
{
    private readonly AppDbContext _dbContext;
    private readonly IConfiguration _config;

    public IdentityService(AppDbContext dbContext, IConfiguration config)
    {
       _dbContext=dbContext;//to query user tabel
       _config=config;
    }
    //main method
    public async Task<LoginResponse> LoginAsync(LoginDTO loginDto)
{
    try{
        if(string.IsNullOrEmpty(loginDto.Email)|| string.IsNullOrEmpty(loginDto.Password))
        {
            return new LoginResponse
            {
                Message="Email and password are required",
                User=null
            };
        }
        
        //*user here follows User Model not schema
        var user=await _dbContext.Users.FirstOrDefaultAsync(u=>u.Email==loginDto.Email);
        //tasks: query db, verify password and get email, gen. token, then return a response
        if(user==null)
        {
            return new LoginResponse{
                Message="Invalid credentials",
                User=null
            };
        }
        
        if (!BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
        {
            return new LoginResponse{
                Message="Invalid credentials",
                User=null
            };
        }
        string verificationStatus = "n/a";
        if (user.Role=="student")
        {
            var profile=await _dbContext.StudentProfiles.FirstOrDefaultAsync(s=>s.UserId == user.Id);

            if (profile!=null)
            {
                if (profile.Verification_Status!=null)
                {verificationStatus =profile.Verification_Status;}
                else
                {verificationStatus="pending";}
            }
            else
            {
                verificationStatus="pending";
            }
        }
       
        string token=TokenGenerator(user, verificationStatus);
        
        var userDto=new UserDto{
            Id=user.Id, 
            FirstName=user.FirstName,
            LastName=user.LastName,
            PhoneNumber=user.PhoneNumber,
            Email=user.Email,
            Role=user.Role
        };

        return new LoginResponse{
            Message="Login successful",
            User=userDto
        };
        }
        catch(Exception e){
            return new LoginResponse
            {
                Message="An error occurred during login",
                User=null
            };
        }

    }

    private string TokenGenerator(User user, string? verificationStatus=null)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["JWT_SECRET"]!));

        var credentials=new SigningCredentials(key,SecurityAlgorithms.HmacSha256);

        //data that goes iunside token, like an id card
        var claims = new List<Claim>
        {
            new Claim("sub", user.Id.ToString()),
            new Claim("email", user.Email),
            new Claim("role", user.Role),
        };

        if(user.Role=="student")
        {
            claims.Add(new Claim("verification_status",verificationStatus));
        }

        //blueprint for the token(form)
        var token=new JwtSecurityToken(
            claims:claims,
            signingCredentials:credentials,
            expires: DateTime.UtcNow.AddHours(24)
        );
        return new JwtSecurityTokenHandler().WriteToken(token);

    }
}
}