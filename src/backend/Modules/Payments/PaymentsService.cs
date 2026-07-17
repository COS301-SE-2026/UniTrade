using Microsoft.Extensions.Configuration;
using System.Globalization;
using Modules.Reservations;
using Modules.Identity.Models.Dto;

namespace Modules.Payments;

public class PaymentService :IPaymentsService
{
    private readonly IReservationRepository _reservations;///***chech if this causes circular dependency or affect the arch/////
    private readonly string _merchantId;
    private readonly string _merchantKey;
    private readonly string _sandboxUrl;
    private readonly string _passphrase;

    public PaymentService(IReservationRepository reservations,IConfiguration config)
    {
        _reservations=reservations;
        _merchantId=config["PayFast:MerchantId"]?? throw new InvaildOperationException("Merchant Id not configured");
        _merchantKey=config["PayFast:MerchantKey"]?? throw new InvaildOperationException("Merchant Key not configured");
        _sandboxUrl=config["PayFast:SandboxUrl"]?? throw new InvaildOperationException("Sandbox Url not configured");
        _passphrase=config["PayFast:Passphrase"]?? throw new InvaildOperationException("Passphrase not configured");

    }

    public async Task<PaymentRequestDto> CreatesPaymentReq(Guid reservationId,Guid buyerId,CancellationToken ct = default)
    {
        var reservation=await _reservations.GetByIdAsync(reservationId,ct) ??throw new PaymentException(PaymentErrors.ReservationNotFound);
        if(reservation.BuyerId!=buyerId)
        {
            throw new PaymentException(PaymentErrors.NotBuyer);
        }

        if(reservation.ReservationStatus!=ReservationState.Active)
        {
            throw new PaymentException(PaymentErrors.InvalidStatus);
        }

        var listing=reservation.ReservationListins.First().Listing;
        var buyer=reservation.Buyer;

        var fields=BuildFields(reservation.ReservationId,listing.Title,listing.Price,buyer);
        var signature=GenerateSignature(fields);

        var fieldsWithSign=new Dictionary<string,string>(fields){["signature"]=signature};

        return new PaymentRequestDto(_processUrl,fieldsWithSign);
    }

    private List<KeyValuePair<string,string>> BuildFields(Guid reservationId,string listingTitle,decimal price,UserDto userId)
    {
        var fields=new List<KeyValuePair<string,string>>
        {
            new("merchant_id"._merchantId),
            new("merchant_key",_merchantKey),
            new("sandbox_url",_sandboxUrl).
        };
        return fields.Where(f=>!string.IsNullOrEmpty(f.Value)).ToList();
    }

    private string GenerateSignature(List<KeyValuePair<string,string>> fields)
    {
        var sb=new StringBuilder();

        foreach(var (key,value) in fields)
        {
            sb.Append($"{key}={HttpUtility.UrlEncode(value)}&");
        }

        if(!string.IsNullOrEmpty(_passphrase))
        {
            sb.Append($"passphrase={HttpUtility.UrlEncode(_passphrase)}");
        }
        else{
            sb.Length=-1;
        }

        using var md5=MD5.Create();
        var hash=md5.ComputeHash(Encoding.UTF8.GetBytes(sb.ToString()));

        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static string Truncate(string value,int maxLength)=>value.Length <= maxLength? value:value[..maxLength];

}