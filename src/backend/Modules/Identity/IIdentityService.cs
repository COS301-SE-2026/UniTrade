using Modules.Identity.Models;
using Modules.Identity.Models.Dto;
using Modules.Identity.Models.DTO;

namespace Modules.Identity;

public interface IIdentityService
{
    Task<User> RegisterAsync(RegisterDto dto);
    Task<User?> GetUserByEmailAsync(string email);
    Task<string> LoginAsync(LoginDto loginDto);
    Task<object> GetMeAsync(string userId);
    Task<object> UpdateProfileAsync(string userId, UpdateProfileDto dto);
    Task DeleteAccountAsync(string userId);
    Task<string> GenerateAuthTokenAsync(Guid userId);

    string GenerateHubToken(string userId);
}
