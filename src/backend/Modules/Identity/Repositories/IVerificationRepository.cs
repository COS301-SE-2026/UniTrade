using Microsoft.EntityFrameworkCore;
using Modules.Identity.Models;

namespace Modules.Identity.Verification;

public interface IVerificationRepository
{
    Task<VerificationRequest?> GetCurrentByUserIdAsync(Guid userId);
    Task CreateAsync(VerificationRequest request);
    Task UpdateAsync(VerificationRequest request);
}
