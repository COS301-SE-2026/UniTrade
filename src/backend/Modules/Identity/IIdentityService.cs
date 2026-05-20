using Modules.Identity.Models.Dto;
using Modules.Identity.Models;

namespace Modules.Identity;

public interface IIdentityService
{
    
    Task<User> RegisterAsync(RegisterDto dto);
    Task<User?> GetUserByEmailAsync(string email);
    Task<string> LoginAsync(LoginDTO loginDto);
    Task<object> GetMeAsync(string userId); 
}
