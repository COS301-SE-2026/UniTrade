using API.Modules.Identity.Models.DTO;
using API.Modules.Identity.Models;

namespace API.Modules.Identity
{
    public interface IIdentityService
    {
        Task<LoginResponse> LoginAsync(LoginDTO loginDto);
    }
}