namespace Modules.Payments;

public sealed class PaymentException(string code) : Exception(code) { }

public static class PaymentErrors
{
    public const string ReservationNotFound = "reservation_not_found";
    public const string NotBuyer = "not_buyer";
    public const string InvalidStatus = "invalid_status";
}

