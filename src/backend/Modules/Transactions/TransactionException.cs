namespace Modules.Transactions;

public sealed class TransactionException : Exception
{
    public string Code { get; }

    public TransactionException(string code)
        : base(code)
    {
        Code = code;
    }
}

public static class TransactionErrors
{
    public const string ReservationNotFound = "reservation_not_found";
    public const string NotBuyer = "not_buyer";
    public const string InvalidStatus = "invalid_status";
}
