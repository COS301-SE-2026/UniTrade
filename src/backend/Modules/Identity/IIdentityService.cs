using Modules.Identity.Models;
using Modules.Identity.Models.Dto;

namespace Modules.Identity;

public interface IIdentityService
{
    
    Task<User> RegisterAsync(RegisterDto dto);
    Task<User?> GetUserByEmailAsync(string email);
}

