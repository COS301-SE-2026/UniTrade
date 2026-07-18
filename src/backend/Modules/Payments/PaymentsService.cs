using System.Globalization;
using System.Text;
using System.Web;
using Microsoft.Extensions.Configuration;
using Modules.Identity.Models.Dto;
using Modules.Payments.Models.Dto;
using Modules.Reservations;
using Modules.Reservations.Repositories;
using Modules.Payments.Repositories;
using Modules.Payments.Models;
using System.Security.Cryptography;
using Modules.Reservations.StateMachine;

namespace Modules.Payments;

public class PaymentService : IPaymentsService
{
    private readonly IReservationRepository _reservations;
    private readonly ITransactionRepository _transactions;
    private readonly IBroadCastService _broadcast;


    ///***chech if this causes circular dependency or affect the arch/////
    private readonly string _merchantId;
    private readonly string _merchantKey;
    private readonly string _sandboxUrl;
    private readonly string _passphrase;

    public PaymentService(IReservationRepository reservations, IConfiguration config,IBroadCastService broadcast,ITransactionRepository transactions)
    {
        _reservations = reservations;
        _merchantId =
            config["PayFast:MerchantId"]
            ?? throw new InvalidOperationException("Merchant Id not configured");
        _merchantKey =
            config["PayFast:MerchantKey"]
            ?? throw new InvalidOperationException("Merchant Key not configured");
        _sandboxUrl =
            config["PayFast:SandboxUrl"]
            ?? throw new InvalidOperationException("Sandbox Url not configured");
        _passphrase =
            config["PayFast:Passphrase"]
            ?? throw new InvalidOperationException("Passphrase not configured");

        _transactions=transactions;
        _broadcast=broadcast;
    }

    public async Task<PaymentRequestDto> CreatesPaymentReq(
        Guid reservationId,
        Guid buyerId,
        CancellationToken ct = default
    )
    {
        var reservation =
            await _reservations.GetByIdAsync(reservationId, ct)
            ?? throw new PaymentException(PaymentErrors.ReservationNotFound);
        if (reservation.BuyerId != buyerId)
        {
            throw new PaymentException(PaymentErrors.NotBuyer);
        }

        if (reservation.ReservationStatus != ReservationState.Active)
        {
            throw new PaymentException(PaymentErrors.InvalidStatus);
        }

        var listing = reservation.ReservationListings.First().Listing;
        var buyer = reservation.Buyer;

        var fields = BuildFields(reservation.ReservationId, listing.Title, listing.Price, buyer);
        var signature = GenerateSignature(fields);

        var fieldsWithSign = new Dictionary<string, string>(fields) { ["signature"] = signature };

        return new PaymentRequestDto(_sandboxUrl, fieldsWithSign);
    }

    private List<KeyValuePair<string, string>> BuildFields(
        Guid reservationId,
        string listingTitle,
        decimal price,
        Modules.Identity.Models.User buyer
    )
    {
        var fields = new List<KeyValuePair<string, string>>
        {
            new("merchant_id", _merchantId),
            new("merchant_key", _merchantKey),
            new("sandbox_url", _sandboxUrl),
        };
        return fields.Where(f => !string.IsNullOrEmpty(f.Value)).ToList();
    }

    private string GenerateSignature(List<KeyValuePair<string, string>> fields)
    {
        var sb = new StringBuilder();

        foreach (var (key, value) in fields)
        {
            sb.Append($"{key}={HttpUtility.UrlEncode(value)}&");
        }

        if (!string.IsNullOrEmpty(_passphrase))
        {
            sb.Append($"passphrase={HttpUtility.UrlEncode(_passphrase)}");
        }
        else
        {
            sb.Length = -1;
        }

        using var md5 = MD5.Create();
        var hash = md5.ComputeHash(Encoding.UTF8.GetBytes(sb.ToString()));

        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static string Truncate(string value, int maxLength) =>
        value.Length <= maxLength ? value : value[..maxLength];

    public bool VerifySignature(Dictionary<string, string> itnFields, string receivedSign)
    {
        var fields = itnFields
            .Where(f => f.Key != "signature" && !string.IsNullOrEmpty(f.Value))
            .ToList();
        var Gensignature = GenerateSignature(fields);
        return Gensignature == receivedSign.ToLowerInvariant();
    }

    public async Task ConfirmPaymentAsync(Guid reservationId,string payfastPaymentId,CancellationToken ct=default)
    {
        var reservation=await _reservations.GetByIdTrackedAsync(reservationId,ct) ?? throw new PaymentException(PaymentErrors.ReservationNotFound);
        
        var existing=await _transactions.GetByReservationIdTrackedAsync(reservationId,ct);
        
        if(existing is not null && existing.PaymentStatus=="completed")
        {
            return;
        }

        var pin=GeneratePin();
        var pinHash=HashPin(pin);
        var listing=reservation.ReservationListings.First().Listing;

        if(existing is null)
        {
            existing=new Transaction
            {
                ReservationId=reservationId,
                BuyerId=reservation.BuyerId,
                SellerId=reservation.SellerId,
                Amount=listing.Price,
            };

            await _transactions.AddAsync(existing,ct);
        }

        existing.PayFastPaymentId=payfastPaymentId;
        existing.PaymentStatus="completed";
        existing.PinHash=pinHash;
        existing.PinStatus="pending";

        await _transactions.SaveAsync(ct);
        await _broadcast.SendToUserAsync(reservation.BuyerId,"pin_generated",new{reservationId,pin});//dont forge to impl.!!!(sabira)
    }

    public async Task VerifyPinAsync(Guid reservationId,Guid sellerId,string pin, CancellationToken ct=default)
    {
        var tx=await _transactions.GetByReservationIdTrackedAsync(reservationId,ct);
        if(tx.SellerId!=sellerId)
        {
            throw new PaymentException("not_seller");
        }

        if(tx.PinStatus=="confirmed")
        {
            return;
        }

        if(tx.PinAttempts>=5)
        {
            throw new PaymentException("too_many_attempts");
        }

        if(HashPin(pin)!=tx.PinHash)
        {
            tx.PinAttempts+=1;
            await _transactions.SaveAsync(ct);
            throw new PaymentException("invalid_pin");
        }

        tx.PinStatus="confirmed";
        tx.PinEnteredAt=DateTime.UtcNow;

        var reservation=await _reservations.GetByIdTrackedAsync(reservationId,ct) ?? throw new PaymentException(PaymentErrors.ReservationNotFound);
        reservation.ReservationStatus=ReservationState.Completed;

        var listing=reservation.ReservationListings.First().Listing;

        await _transactions.SaveAsync(ct);
        await _reservations.SaveAsync(ct);
    }

    private static string GeneratePin()=> RandomNumberGenerator.GetInt32(100000,999999).ToString();

    private static string HashPin(string pin)
    {
        using var sha=SHA256.Create();
        var hash=sha.ComputeHash(Encoding.UTF8.GetBytes(pin));

        return Convert.ToHexString(hash).ToLowerInvariant();
    }

}
