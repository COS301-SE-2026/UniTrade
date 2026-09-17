using Modules.Reservations.Repositories;
using Modules.Reservations.StateMachine;
using Modules.Timetable;
using Modules.Timetable.Models;

namespace Modules.Reservations.Availability;

public sealed class AvailabilityService : IAvailabilityService
{
    private static readonly TimeZoneInfo _sast = FindSast();
    private readonly IReservationRepository _reservations;
    private readonly ITimetableQueryForAvailability _timetables;
    private readonly TimeProvider _time;

    public AvailabilityService(
        IReservationRepository reservations,
        ITimetableQueryForAvailability timetables,
        TimeProvider time
    )
    {
        _reservations = reservations;
        _timetables = timetables;
        _time = time;
    }

    public async Task<AvailabilityResult> GetAvailabilityAsync(
        Guid reservationId,
        Guid callerId,
        CancellationToken ct = default
    )
    {
        var reservation = await _reservations.GetByIdAsync(reservationId, ct);
        if (
            reservation is null
            || (reservation.BuyerId != callerId && reservation.SellerId != callerId)
            || reservation.ReservationStatus != ReservationState.Active
        )
        {
            throw new ReservationException(ReservationErrors.ReservationNotFound);
        }

        var buyerEntries = await _timetables.ListForUserAsync(reservation.BuyerId, ct);
        var sellerEntries = await _timetables.ListForUserAsync(reservation.SellerId, ct);

        if (buyerEntries.Count == 0)
            return new AvailabilityResult.MissingTimetable("buyer");
        if (sellerEntries.Count == 0)
            return new AvailabilityResult.MissingTimetable("seller");

        var nowSast = GetNowSast();
        var buyerBusy = MapBusy(buyerEntries);
        var sellerBusy = MapBusy(sellerEntries);
        var slots = AvailabilityCalculator.Compute(buyerBusy, sellerBusy, nowSast);

        if (slots.Count == 0)
            return new AvailabilityResult.NoOverlap();

        var windows = slots.Select(s => new AvailabilityWindow(s.Date, s.Start, s.End)).ToList();

        return new AvailabilityResult.Ok(windows);
    }

    private DateTime GetNowSast() =>
        TimeZoneInfo.ConvertTimeFromUtc(_time.GetUtcNow().UtcDateTime, _sast);

    private static IReadOnlyList<BusyBlock> MapBusy(IReadOnlyList<TimetableEntry> entries)
    {
        var result = new List<BusyBlock>(entries.Count);
        foreach (var entry in entries)
            result.Add(new BusyBlock(entry.DayOfWeek, entry.StartTime, entry.EndTime));
        return result;
    }

    private static TimeZoneInfo FindSast()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Africa/Johannesburg");
        }
        catch (Exception ex) when (ex is TimeZoneNotFoundException or InvalidTimeZoneException)
        {
            return TimeZoneInfo.CreateCustomTimeZone(
                id: "SAST",
                baseUtcOffset: TimeSpan.FromHours(2),
                displayName: "South African Standard Time",
                standardDisplayName: "SAST"
            );
        }
    }
}
