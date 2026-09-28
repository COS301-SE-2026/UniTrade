using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Modules.Disputes.Models;
using Modules.Disputes.Repositories;

namespace Infrastructure.Persistence.Repositories.Disputes;

public class CaseNoteRepository : ICaseNoteRepository
{
    private readonly AppDbContext _db;

    public CaseNoteRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<CaseNote>> ListByCaseIdAsync(Guid caseId, CancellationToken ct = default)
    {
        return await _db
            .CaseNotes.Where(n => n.CaseId == caseId)
            .OrderBy(n => n.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<CaseNote> AddAsync(Guid caseId, Guid authorAdminId, string content, CancellationToken ct = default)
    {
        var note = new CaseNote
        {
            NoteId = Guid.NewGuid(),
            CaseId = caseId,
            AuthorAdminId = authorAdminId,
            Content = content,
            CreatedAt = DateTime.UtcNow,
        };

        _db.CaseNotes.Add(note);
        await _db.SaveChangesAsync(ct);
        return note;
    }
}
