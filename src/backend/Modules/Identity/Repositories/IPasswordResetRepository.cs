using Modules.Identity.Models;

namespace Modules.Identity.Repositories;

public interface IPasswordResetRepository 
{
    Task<PasswordResetRequest?> GetCurrentByUserIdAsync(Guid userId);
    Task CreateAsync(PasswordResetRequest request );
    Task UpdateAsync(PasswordResetRequest request);
}