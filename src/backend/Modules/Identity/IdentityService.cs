using API.Modules.Identity;
using API.Modules.Identity.Models.DTO;
using API.Infrastructure.Persistence;

namespace API.Models.Identity
{
public class IdentityService: IIdentityService
{
    private readonly AppDbContext _dbContext;
    public IdentityService(AppDbContext dbContext)
    {
       _dbContext=dbContext;//to query user tabel
    }
    //main method
    public async Task<LoginResponse> LoginAsync(LoginDTO loginDto)
    {
        var user=await _dbContext.Users.FirstOrDefaultAsync(u=>u.email==loginDto.Email);
        //tasks: query db, verify password and get email, gen. token, then return a response
        if(user==null)
        {
            return new LoginResponse{
                Token=null,
                Message="Invalid credentials",
                User=null;
            };
        }
        
        if(user.password_hash!=loginDto.Password)//remeber to hash this!!
        {
            return new LoginResponse{
                Token=null,
                Message="Invalid credentials",
                User=null;
            };
        }
       
        string token="";
        
        var userDto=new UserDto{Id=user.user_id, FirstName=user.first_name,LastName=user.last_name,PhoneNumber=user.phone_number};

        return new LoginResponse{
            Token=token,
            Message="Login successful",
            user=userDto
        };

    }
}
}