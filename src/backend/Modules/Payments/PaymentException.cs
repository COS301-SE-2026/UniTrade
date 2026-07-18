namespace Modules.Payments;

public sealed class PaymentException: Exception { 
    public string Code{get;}
    public PaymentException(string code):base(code)
    {
        Code=code;
    }
}

public static class PaymentErrors
{
    public const string ReservationNotFound = "reservation_not_found";
    public const string NotBuyer = "not_buyer";
    public const string InvalidStatus = "invalid_status";
}

