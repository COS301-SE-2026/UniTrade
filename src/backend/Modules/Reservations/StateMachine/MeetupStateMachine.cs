using Modules.Reservations.Models;

namespace Modules.Reservations.StateMachine;

public static class MeetupStateMachine
{
    public static readonly TimeSpan CheckInOpensBefore = TimeSpan.FromMinutes(15); // check-in period opens 15 minutes before

    public static bool IsCheckInWindowOpen(Meetup m, DateTime now) =>
        now >= m.AgreedTime - CheckInOpensBefore && now <= m.CheckinWindowClosesAt;

    // if no location permission, still allows for payments to be unlocked, just that they cant raise disputes later because well..
    public static bool CheckInBuyer(Meetup m, DateTime now, decimal? lat, decimal? lng)
    {
        if (m.Status != "scheduled")
        {
            throw new ReservationException(ReservationErrors.MeetupNotScheduled);
        }
        if (!IsCheckInWindowOpen(m, now))
        {
            throw new ReservationException(ReservationErrors.CheckInWindowClosed);
        }

        if (m.BuyerCheckedIn)
        {
            throw new ReservationException(ReservationErrors.AlreadyCheckedIn);
        }
        m.BuyerCheckedIn = true;
        m.BuyerCheckinTime = now;

        var hasLocation = lat is not null && lng is not null;
        if (!hasLocation)
        {
            return false;
        }

        var inRange = GeoDistance.IsWIthinRadius(
            m.AgreedLatitude,
            m.AgreedLatitude,
            lat!.Value,
            lng!.Value
        );
        if (!inRange)
        {
            return false;
        }

        m.BuyerCheckinLatitude = lat;
        m.BuyerCheckinLongitude = lng;
        return true;
    }

    public static bool CheckInSeller(Meetup m, DateTime now, decimal? lat, decimal? lng)
    {
        if (m.Status != "scheduled")
        {
            throw new ReservationException(ReservationErrors.MeetupNotScheduled);
        }
        if (!IsCheckInWindowOpen(m, now))
        {
            throw new ReservationException(ReservationErrors.CheckInWindowClosed);
        }

        if (m.SellerCheckedIn)
        {
            throw new ReservationException(ReservationErrors.AlreadyCheckedIn);
        }
        m.SellerCheckedIn = true;
        m.SellerCheckinTime = now;

        var hasLocation = lat is not null && lng is not null;
        if (!hasLocation)
        {
            return false;
        }

        var inRange = GeoDistance.IsWIthinRadius(
            m.AgreedLatitude,
            m.AgreedLatitude,
            lat!.Value,
            lng!.Value
        );
        if (!inRange)
        {
            return false;
        }

        m.SellerCheckinLatitude = lat;
        m.SellerCheckinLongitude = lng;
        return true;
    }

    public static bool IsPaymentUnlocked(Meetup m) => m.Status == "scheduled" && m.BuyerCheckedIn; // the reason why the isn't a check for seller, is because their attendance will be captured by the pin anyway
}
