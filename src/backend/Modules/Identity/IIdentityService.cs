using Modules.Identity.Models.DTO;
using Modules.Identity.Models;

namespace API.Modules.Identity
{
    public interface IIdentityService
    {
        Task<LoginResponse> LoginAsync(LoginDTO loginDto);
    }
}