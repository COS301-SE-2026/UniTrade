using Modules.Listings.Models;
using Modules.Reservations.Models;

namespace Modules.Reservations.StateMachine;

public static class ReservationStateMachine
{
    public static readonly TimeSpan ResponseWindow = TimeSpan.FromHours(24);
    public static readonly TimeSpan SellerReleaseAfterBuyerSilence = TimeSpan.FromHours(12);
    public static readonly TimeSpan CheckinWindowAfterMeetup = TimeSpan.FromMinutes(30);

    public static string DeriveTimerStage(Reservation r)
    {
        if (r.MeetupConfirmedAt is not null)
        {
            return TimerStages.MeetupConfirmed;
        }

        if (r.BuyerRespondedAt is not null)
        {
            return TimerStages.Coordinating;
        }
        if (r.SellerAcknowledgedAt is not null)
        {
            return TimerStages.AwaitingBuyer;
        }
        return TimerStages.AwaitingSeller;
    }

    // to be called after the system generates the first message
    public static void Acknowledge(Reservation r, Guid calledId, DateTime now)
    {
        if (r.SellerId != calledId)
        {
            throw new ReservationException(ReservationErrors.Forbidden);
        }

        if (r.ReservationStatus != ReservationState.Active)
        {
            throw new ReservationException(ReservationErrors.NotActive);
        }
        if (r.SellerAcknowledgedAt is not null)
        {
            throw new ReservationException(ReservationErrors.AlreadyAcknowledged);
        }
        r.SellerAcknowledgedAt = now;
        r.ExpiresAt = now + ResponseWindow;
    }

    // for when then the buyer responds/first text to acknowledgement
    public static bool RegisterBuyerResponse(Reservation r, Guid callerId, DateTime now)
    {
        if (r.BuyerId != callerId)
        {
            return false;
        }
        if (r.ReservationStatus != ReservationState.Active)
        {
            return false;
        }

        if (r.SellerAcknowledgedAt is null)
        {
            return false;
        }

        if (r.BuyerRespondedAt is not null)
        {
            return false;
        }

        r.BuyerRespondedAt = now;
        r.ExpiresAt = now + ResponseWindow;
        return true;
    }

    // rn, a buyer can cancel anytime (from client request)

    // otherwise seller releases only after 12h of buyer silence
    public static void Cancel(Reservation r, Guid callerId, DateTime now)
    {
        if (ReservationState.IsTerminal(r.ReservationStatus))
        {
            throw new ReservationException(ReservationErrors.AlreadyTerminal);
        }
        if (callerId == r.BuyerId)
        {
            r.ReservationStatus = ReservationState.Cancelled;
            return;
        }
        if (callerId == r.SellerId)
        {
            if (!CanSellerRelease(r, now))
            {
                throw new ReservationException(ReservationErrors.ReleasedTooEarly);
            }
            r.ReservationStatus = ReservationState.Cancelled;
            return;
        }
        throw new ReservationException(ReservationErrors.Forbidden);
    }

    public static bool CanSellerRelease(Reservation r, DateTime now)
    {
        if (r.SellerAcknowledgedAt is null)
        {
            return true;
        }
        if (r.BuyerRespondedAt is not null)
        {
            return false;
        }

        return now - r.SellerAcknowledgedAt >= SellerReleaseAfterBuyerSilence;
    }

    public static void Expire(Reservation r, DateTime now)
    {
        if (ReservationState.IsTerminal(r.ReservationStatus))
        {
            throw new ReservationException(ReservationErrors.AlreadyTerminal);
        }
        if (r.ExpiresAt > now)
        {
            throw new ReservationException(ReservationErrors.NotYetExpired);
        }

        r.ReservationStatus = ReservationState.Expired;
    }

    public static void ConfirmMeetup(Reservation r, DateTime now)
    {
        if (r.ReservationStatus != ReservationState.Active)
        {
            throw new ReservationException(ReservationErrors.NotActive);
        }

        if (r.MeetupConfirmedAt is not null)
        {
            throw new ReservationException(ReservationErrors.MeetupAlreadyConfirmed);
        }
        r.MeetupConfirmedAt = now;
    }

    public static bool IsTimerPaused(Reservation r) => r.MeetupConfirmedAt is not null;
}
