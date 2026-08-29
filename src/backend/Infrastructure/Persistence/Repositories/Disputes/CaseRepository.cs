using Infrastructure.Persistence;
using Modules.Disputes.Models;
using Modules.Disputes.Repositories;

namespace Infrastructure.Persistence.Repositories.Disputes;

public class CaseRepository: ICaseRepository
{
    private readonly AppDbContext _db;

    public CaseRepository(AppDbContext db)
    {
        _db=db;
    }

    public async Task<Guid> CreateCaseAsync(string caseType,Guid subjectUserId, Guid filedByUserId, string evidenceJson,string? description, CancellationToken ct=default)
    {
        var evidence=System.Text.Json.JsonDocument.Parse(evidenceJson).RootElement;

        Guid? reservationId=null;
        Guid? listingId=null;

        var photos=new List<string>();
        var sellerRefusedPhotos=false;

        if(evidence.TryGetProperty("snapshot",out var snap))
        {
            if(snap.TryGetProperty("reservationId",out var rid))
            {
                reservationId=rid.GetGuid();
            }
            if(snap.TryGetProperty("listingId",out var lid))
            {
                listingId=lid.GetGuid();
            }
        }
        if(evidence.TryGetProperty("photos",out var ph))
        {
            photos=ph.EnumerateArray().Select(p=>p.GetString()!).ToList();
        }
        if(evidence.TryGetProperty("sellerRefusedPhotos",out var srp))
        {
            sellerRefusedPhotos=srp.GetBoolean();
        }

        var dispute=new Dispute
        {
            DisputeId=Guid.NewGuid(),
            Type=caseType,
            Status="pending",
            SubjectUserId=subjectUserId,
            RaisedBy=filedByUserId,
            ReservationId=reservationId,
            ListingId=listingId,
            Photos=photos,
            SellerRefusedPhotos=sellerRefusedPhotos,
            Description=description,
            SubmittedAt=DateTime.UtcNow,
        };

        _db.Disputes.Add(dispute);
        await _db.SaveChangesAsync(ct);
        return dispute.DisputeId;
    }

}