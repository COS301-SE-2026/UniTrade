using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Modules.Identity.Models;
using Modules.Identity.Models.Dto;
using Modules.Identity.Verification;

namespace Modules.Identity.Verification;

public class VerificationRepository : IVerificationRepository
{
    private readonly AppDbContext _db;

    public VerificationRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<VerificationRequest?> GetCurrentByUserIdAsync(Guid userId)
    {
        return await _db.VerificationRequests.FirstOrDefaultAsync(x =>
            x.UserId == userId && x.IsCurrent
        );
    }

    public async Task CreateAsync(VerificationRequest request)
    {
        _db.VerificationRequests.Add(request);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateAsync(VerificationRequest request)
    {
        _db.VerificationRequests.Update(request);
        await _db.SaveChangesAsync();
    }

    public async Task<IReadOnlyList<VerificationCaseDto>> ListPendingAsync(
        CancellationToken ct = default
    )
    {
        var query =
            from vr in _db.VerificationRequests.AsNoTracking()
            where
                vr.IsCurrent
                && vr.AdminDecision == null
                && (vr.Status == "por_pending" || vr.Status == "under_review")
            join u in _db.Users on vr.UserId equals u.UserId
            join sp in _db.StudentProfiles on u.UserId equals sp.StudentId
            join uni in _db.Universities on sp.UniversityId equals uni.UniversityId
            orderby vr.SubmittedAt
            select new VerificationCaseDto
            {
                VerificationId = vr.VerificationId,
                UserId = vr.UserId,
                Status = vr.Status,
                AdminDecision = vr.AdminDecision,
                SubmittedAt = vr.SubmittedAt,
                University = uni.Name,
                Degree = sp.DegreeProgram ?? "",
                Year = sp.YearOfStudy,
                Email = u.Email,
            };

        return await query.ToListAsync(ct);
    }

    public async Task<VerificationCaseDto?> GetCaseByIdAsync(
        Guid verificationId,
        CancellationToken ct = default
    )
    {
        var query =
            from vr in _db.VerificationRequests.AsNoTracking()
            where vr.VerificationId == verificationId
            join u in _db.Users on vr.UserId equals u.UserId
            join sp in _db.StudentProfiles on u.UserId equals sp.StudentId
            join uni in _db.Universities on sp.UniversityId equals uni.UniversityId
            select new VerificationCaseDto
            {
                VerificationId = vr.VerificationId,
                UserId = vr.UserId,
                Status = vr.Status,
                AdminDecision = vr.AdminDecision,
                SubmittedAt = vr.SubmittedAt,
                University = uni.Name,
                Degree = sp.DegreeProgram ?? "",
                Year = sp.YearOfStudy,
                Email = u.Email,
            };
        return await query.FirstOrDefaultAsync(ct);
    }

    public async Task<VerificationRequest?> GetByIdAsync(
        Guid verificationId,
        CancellationToken ct = default
    ) =>
        await _db.VerificationRequests.FirstOrDefaultAsync(
            x => x.VerificationId == verificationId,
            ct
        );
}
