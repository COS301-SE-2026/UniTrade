using Modules.Identity.Models;
using Modules.Identity.Models.Dto;
using Modules.Identity.Models.DTO;

namespace Modules.Identity;

public interface IIdentityService
{
    
    Task<User> RegisterAsync(RegisterDto dto);
    Task<User?> GetUserByEmailAsync(string email);
    Task<string> LoginAsync(LoginDTO loginDto);
}
