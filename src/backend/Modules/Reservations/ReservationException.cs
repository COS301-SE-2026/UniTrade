namespace Modules.Reservations;

// for sonarqube purposes because it won't stop b**kig

public sealed class ReservationException(string code) : Exception(code) { }

public static class ReservationErrors
{
    public const string NotFound = "not_found";
    public const string ListingNotFound = "listing_not_found";
    public const string AlreadyReserved = "already_reserved";
    public const string SelfReserve = "self_reserve";
    public const string Forbidden = "forbidden";
    public const string NotVerified = "not_verified";
    public const string NotActive = "not_active";
    public const string AlreadyAcknowledged = "already_acknowledged";
    public const string AlreadyTerminal = "already_terminal";
    public const string ReleasedTooEarly = "release_too_early";
    public const string NotYetExpired = "not_yet_expired";
    public const string TimeInPast = "time_in_past";
    public const string Cancelled = "cancelled";
    public const string ProposalNotFound = "proposal_not_found";
    public const string NotAProposal = "not_a_proposal";
    public const string CannotAcceptOwnProposal = "cannot_accept_own_proposal";
    public const string AlreadyResponded = "already_responded";
    public const string MeetupAlreadyConfirmed = "meetup_already_confirmed";
    public const string MeetupNotFound = "meetup_not_found";
    public const string MeetupNotScheduled = "meetup_not_scheduled";
    public const string CheckInWindowClosed = "check_in_window_closed";
    public const string AlreadyCheckedIn = "already_checked_in";
}
