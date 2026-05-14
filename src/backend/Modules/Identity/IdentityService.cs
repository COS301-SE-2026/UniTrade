using API.Modules.Identity;
using API.Modules.Identity.Models.DTO;
using API.Infrastructure.Persistence;

using Microsoft.IdentityModel.Tokens;
using System.Text;//for encoding

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
       
        string token=TokenGenerator(user);
        
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

    private string TokenGenerator(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["JWT_SECRET"]!));

        var credentials=new SigningCredentials(key,SecurityAlgorithms.HmacSha256);

        //data that goes iunside token, like an id card
        var claims = new[]
        {
            new Claim("sub", user.Id.ToString()),
            new Claim("email", user.Email),
            new Claim("role", user.Role),
            new Claim("verification_status", user.Verification_Status)
        };

        //blueprint for the token(form)
        var token=JwtSecurityToken{
            claims:claims,
            signingCredentials:credentials,
            expires: DateTime.UtcNow.AddHoours(24)
        };
        return new JwtSecurityTokenHandler().WriteToken(token);

    }
}
}