using Modules.Listings.Models;
using Modules.Listings.Snapshot;
using Modules.Listings.Repositories;
using Modules.Listings.Models.Dto;

namespace Modules.Listings.Snapshot;

public class ListingSnapshotService : IListingSnapshotService
{
    private readonly IListingSnapshotRepository _snapshots;
    private readonly TimeProvider _clock;

    public ListingSnapshotService(IListingSnapshotRepository snapshots, TimeProvider clock)
    {
        _snapshots = snapshots;
        _clock = clock;
    }

    public async Task<ListingSnapshotDto> CreateSnapshotAsync(Guid reservationId, Listing listing, CancellationToken ct = default)
    {
        var snapshot = new Models.ListingSnapshot
        {
            ReservationId = reservationId,
            ListingId = listing.ListingId,
            Title = listing.Title,
            Price = listing.Price,
            Condition = listing.Condition,
            Description = listing.Description,
            PhotoRefs = listing.Images
                .Select(i => $"/api/listings/{listing.ListingId}/images/{i.ImageId}")
                .ToList(),
            CourseTags = listing.Course is not null
                ? new List<string> { listing.Course.CourseName }
                : new List<string>(),
            CapturedAt = _clock.GetUtcNow().UtcDateTime,
        };

        await _snapshots.AddAsync(snapshot, ct);
        return MapToDto(snapshot);
    }

    public async Task<ListingSnapshotDto?> GetByReservationIdAsync(Guid reservationId, CancellationToken ct = default)
    {
        var snapshot = await _snapshots.GetByReservationIdAsync(reservationId, ct);
        return snapshot is null ? null : MapToDto(snapshot);
    }

    private static ListingSnapshotDto MapToDto(Models.ListingSnapshot s) =>
        new ListingSnapshotDto
        {
            //ListingId=s.ListingId,
            //ReservationId=s.ReservationId,
            Title = s.Title,
            Price = s.Price,
            Condition = s.Condition,
            CourseTags = s.CourseTags,
            PhotoRefs = s.PhotoRefs,
            CapturedAt = s.CapturedAt
        };
}
