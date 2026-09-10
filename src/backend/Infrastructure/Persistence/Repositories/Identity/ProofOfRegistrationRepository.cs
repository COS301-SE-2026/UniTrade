using Microsoft.EntityFrameworkCore;
using Modules.Identity.Models;
using Modules.Identity.Repositories;

namespace Infrastructure.Persistence.Repositories.Identity;

public class ProofOfRegistrationRepository : IProofOfRegistrationRepository
{
    private readonly AppDbContext _db;

    public ProofOfRegistrationRepository(AppDbContext db) => _db = db;

    public async Task<int> AddOrReplaceAsync(
        ProofOfRegistrationDocument document,
        CancellationToken ct = default
    )
    {
        var existing = await _db.ProofOfRegistrationDocuments.FirstOrDefaultAsync(
            d => d.VerificationId == document.VerificationId,
            ct
        );

        if (existing is null)
        {
            _db.ProofOfRegistrationDocuments.Add(document);
            await _db.SaveChangesAsync(ct);
            return document.DocumentId;
        }

        existing.FileData = document.FileData;
        existing.ContentType = document.ContentType;
        existing.FileSize = document.FileSize;
        existing.FileName = document.FileName;
        existing.UploadedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return existing.DocumentId;
    }

    public async Task<(byte[] Data, string ContentType, string FileName)?> GetDataAsync(
        Guid verificationId,
        CancellationToken ct = default
    )
    {
        var doc = await _db
            .ProofOfRegistrationDocuments.AsNoTracking()
            .FirstOrDefaultAsync(d => d.VerificationId == verificationId, ct);

        return doc is null ? null : (doc.FileData, doc.ContentType, doc.FileName);
    }

    public async Task DeleteAsync(Guid verificationId, CancellationToken ct = default)
    {
        var doc = await _db.ProofOfRegistrationDocuments.FirstOrDefaultAsync(
            d => d.VerificationId == verificationId,
            ct
        );

        if (doc is not null)
        {
            _db.ProofOfRegistrationDocuments.Remove(doc);
            await _db.SaveChangesAsync(ct);
        }
    }
}
