using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Web;
using Microsoft.Extensions.Configuration;
using Modules.Identity.Models.Dto;
using Modules.Reservations;
using Modules.Reservations.Repositories;
using Modules.Reservations.StateMachine;
using Modules.Transactions.Models;
using Modules.Transactions.Models.Dto;
using Modules.Transactions.Repositories;

namespace Modules.Transactions;

public class TransactionService : ITransactionsService
{
    private readonly IReservationRepository _reservations;
    private readonly ITransactionRepository _transactions;
    private readonly IBroadCastService _broadcast;
    private static readonly Regex HexEscape = new(@"%[0-9a-f]{2}", RegexOptions.Compiled); //added this because currently payfast if failing because the signature is not a match hence transform the signature to uppercase for the match tom pass

    ///***chech if this causes circular dependency or effect the arch/////
    private readonly string _merchantId;
    private readonly string _merchantKey;
    private readonly string _sandboxUrl;
    private readonly string _passphrase;
    private readonly string _notifyUrl;
    private readonly string _returnUrl;
    private readonly string _cancelUrl;

    private static string PayfastUrlEncode(string value)
    {
        var encoded = HttpUtility.UrlEncode(value);
        return HexEscape.Replace(encoded, m => m.Value.ToUpperInvariant());
    }

    public TransactionService(
        IReservationRepository reservations,
        IConfiguration config,
        IBroadCastService broadcast,
        ITransactionRepository transactions
    )
    {
        _reservations = reservations;
        _merchantId = (
            config["PayFast:MerchantId"]
            ?? throw new InvalidOperationException("Merchant Id not configured")
        ).Trim();
        _merchantKey = (
            config["PayFast:MerchantKey"]
            ?? throw new InvalidOperationException("Merchant Key not configured")
        ).Trim();
        _sandboxUrl = (
            config["PayFast:SandboxUrl"]
            ?? throw new InvalidOperationException("Sandbox Url not configured")
        ).Trim();
        _passphrase = (
            config["PayFast:Passphrase"]
            ?? throw new InvalidOperationException("Passphrase not configured")
        ).Trim();

        _notifyUrl = (config["PayFast:NotifyUrl"] ?? "").Trim();
        _returnUrl = (config["PayFast:ReturnUrl"] ?? "").Trim();
        _cancelUrl = (config["PayFast:CancelUrl"] ?? "").Trim();
        _transactions = transactions;
        _broadcast = broadcast;
    }

    public async Task<TransactionRequestDto> CreatesTransactionReq(
        Guid reservationId,
        Guid buyerId,
        CancellationToken ct = default
    )
    {
        var reservation =
            await _reservations.GetByIdAsync(reservationId, ct)
            ?? throw new TransactionException(TransactionErrors.ReservationNotFound);
        if (reservation.BuyerId != buyerId)
        {
            throw new TransactionException(TransactionErrors.NotBuyer);
        }

        if (reservation.ReservationStatus != ReservationState.Active)
        {
            throw new TransactionException(TransactionErrors.InvalidStatus);
        }

        var listing = reservation.ReservationListings.First().Listing;
        var buyer = reservation.Buyer;

        var fields = BuildFields(reservation.ReservationId, listing.Title, listing.Price, buyer);
        var signature = GenerateSignature(fields);

        var fieldsWithSign = new Dictionary<string, string>(fields) { ["signature"] = signature };

        return new TransactionRequestDto(_sandboxUrl, fieldsWithSign);
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
            new("return_url", $"{_returnUrl}?reservationId={reservationId}"),
            new("cancel_url", _cancelUrl),
            new("notify_url", _notifyUrl),
            new("name_first", buyer.FirstName ?? ""),
            new("email_address", buyer.Email ?? ""),
            new("m_payment_id", reservationId.ToString()),
            new("amount", price.ToString("F2", CultureInfo.InvariantCulture)),
            new("item_name", Truncate(listingTitle, 100)),
        };
        return fields
            .Select(f => new KeyValuePair<string, string>(f.Key, f.Value.Trim()))
            .Where(f => !string.IsNullOrEmpty(f.Value))
            .ToList();
    }

    private string GenerateSignature(List<KeyValuePair<string, string>> fields)
    {
        var sb = new StringBuilder();

        foreach (var (key, value) in fields)
        {
            sb.Append($"{key}={PayfastUrlEncode(value)}&");
        }

        if (!string.IsNullOrEmpty(_passphrase))
        {
            sb.Append($"passphrase={PayfastUrlEncode(_passphrase)}");
        }
        else
        {
            sb.Length -= 1;
        }

        Console.WriteLine($"[PayFast Signature Debug] Raw string: {sb}");

        using var md5 = MD5.Create();
        var hash = md5.ComputeHash(Encoding.UTF8.GetBytes(sb.ToString()));

        var result = Convert.ToHexString(hash).ToLowerInvariant();
        Console.WriteLine($"[PayFast Signature Debug] Computed: {result}");

        return result;
    }

    private static string Truncate(string value, int maxLength) =>
        value.Length <= maxLength ? value : value[..maxLength];

    public bool VerifySignature(List<KeyValuePair<string, string>> itnFields, string receivedSign)
    {
        var fields = itnFields.Where(f => f.Key != "signature").ToList();
        var Gensignature = GenerateSignature(fields);
        return Gensignature == receivedSign.ToLowerInvariant();
    }

    public bool VerifySignatureRaw(string rawBody, string receivedSign)
    {
        var withoutSignature = Regex.Replace(rawBody, @"(^|&)signature=[^&]*(&|$)", "$1").Trim('&');

        var sb = new StringBuilder(withoutSignature);
        if (!string.IsNullOrEmpty(_passphrase))
        {
            sb.Append($"&passphrase={PayfastUrlEncode(_passphrase)}");
        }

        Console.WriteLine($"[ITN Debug] String to hash: {sb}");

        using var md5 = MD5.Create();
        var hash = md5.ComputeHash(Encoding.UTF8.GetBytes(sb.ToString()));
        var computed = Convert.ToHexString(hash).ToLowerInvariant();

        Console.WriteLine($"[ITN Debug] Computed:  {computed}");
        Console.WriteLine($"[ITN Debug] Received:  {receivedSign.ToLowerInvariant()}");

        return computed == receivedSign.ToLowerInvariant();
    }

    public async Task ConfirmTransactionAsync(
        Guid reservationId,
        string payfastTransactionId,
        CancellationToken ct = default
    )
    {
        var reservation =
            await _reservations.GetByIdTrackedAsync(reservationId, ct)
            ?? throw new TransactionException(TransactionErrors.ReservationNotFound);

        var existing = await _transactions.GetByReservationIdTrackedAsync(reservationId, ct);

        if (existing is not null && existing.TransactionStatus == "completed")
        {
            return;
        }

        var pin = GeneratePin();
        var pinHash = HashPin(pin);
        var listing = reservation.ReservationListings.First().Listing;

        if (existing is null)
        {
            existing = new Transaction
            {
                ReservationId = reservationId,
                BuyerId = reservation.BuyerId,
                SellerId = reservation.SellerId,
                Amount = listing.Price,
            };

            await _transactions.AddAsync(existing, ct);
        }

        existing.PayFastTransactionId = payfastTransactionId;
        existing.TransactionStatus = "completed";
        existing.PinHash = pinHash;
        existing.Pin = pin;
        existing.PinStatus = "pending";

        await _transactions.SaveAsync(ct);

        await _broadcast.SendToUserAsync(
            reservation.BuyerId,
            "pin_generated",
            new { reservationId, pin }
        );
    }
 
   public async Task<string> GetPendingPinAsync(
    Guid reservationId,
    Guid buyerId,
    CancellationToken ct = default
   )
   {
    var reservation = await _reservations.GetByIdAsync(reservationId, ct)
     ?? throw new TransactionException(TransactionErrors.ReservationNotFound);

     if (reservation.BuyerId != buyerId) 
     {
        throw new TransactionException(TransactionErrors.NotBuyer);
     }

     var tx =
         await _transactions.GetByReservationIdTrackedAsync(reservationId, ct)
         ?? throw new TransactionException("transaction_not_found");

    if (tx.PinStatus != "pending")
    {
        throw new TransactionException("pin_not_pending");
    }

    var pin = GeneratePin();
    tx.PinHash = HashPin(pin);
    await _transactions.SaveAsync(ct);

    return pin;
   }
    public async Task VerifyPinAsync(
        Guid reservationId,
        Guid sellerId,
        string pin,
        CancellationToken ct = default
    )
    {
        var tx =
            await _transactions.GetByReservationIdTrackedAsync(reservationId, ct)
            ?? throw new TransactionException("transaction_not_found");
        if (tx.SellerId != sellerId)
        {
            throw new TransactionException("not_seller");
        }

        if (tx.PinStatus == "confirmed")
        {
            return;
        }

        if (tx.PinAttempts >= 5)
        {
            throw new TransactionException("too_many_attempts");
        }

        if (HashPin(pin) != tx.PinHash)
        {
            tx.PinAttempts += 1;
            await _transactions.SaveAsync(ct);
            throw new TransactionException("invalid_pin");
        }

        tx.PinStatus = "confirmed";
        tx.PinEnteredAt = DateTime.UtcNow;

        var reservation =
            await _reservations.GetByIdTrackedAsync(reservationId, ct)
            ?? throw new TransactionException(TransactionErrors.ReservationNotFound);
        reservation.ReservationStatus = ReservationState.Completed;

        var listing = reservation.ReservationListings.First().Listing;
        listing.ListingStatus = "sold";

        await _transactions.SaveAsync(ct);
        await _reservations.SaveAsync(ct);
    }

    private static string GeneratePin() =>
        RandomNumberGenerator.GetInt32(100000, 999999).ToString();

    private static string HashPin(string pin)
    {
        using var sha = SHA256.Create();
        var hash = sha.ComputeHash(Encoding.UTF8.GetBytes(pin));

        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
