namespace Modules.Reservations.StateMachine;

public static class ReservationState
{
    public const string Active = "active";
    public const string Expired = "expired";
    public const string Cancelled = "cancelled";
    public const string Completed = "completed";

    public static bool IsTerminal(string status) => status is Expired or Cancelled or Completed;
}


public static class TimerStages
{
    public const string AwaitingSeller = "awaiting_seller";
    public const string AwaitingBuyer = "awaiting_buyer";
    public const string Coordinating = "coordinating";
}

public static class ListingStates
{
    public const string Live = "live";
    public const string Reserved = "sold";
    public const string Sold = "sold";
}
