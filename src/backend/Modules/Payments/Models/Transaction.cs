namespace Modules.Payments.Models;

public class Transaction
{
    public Guid TransactionId{get;set;}=Guid.NewGuid();
    public Guid ReservationId{get;set;}
    public Guid BuyerId{get;set;}
    public Guid SellerId{get;set;}
    public decimal Amount{get;set;}
    public string? PayFastPaymentId{get;set;}
    public string PaymentStatus{get;set;}="pending";
    public string? PinHash{get;set;}
    public int PinAttempts{get;set;}=0;
    public DateTime? PinEntered{get;set;}
    public string PinStatus{get;set;}="pending";
    public DateTime CreatedAt{get;set;}=DateTime.UtcNow;

}