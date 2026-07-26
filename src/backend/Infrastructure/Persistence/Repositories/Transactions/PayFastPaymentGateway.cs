using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Web;
using Microsoft.Extensions.Configuration;
using Modules.Transactions;
using Modules.Transactions.Models.Dto;

namespace Infrastructure.Transactions;

public class PayFastPaymentGateway : IPaymentGateway
{
    private readonly string _merchantId;
    private readonly string _merchantKey;
    private readonly string _sandboxUrl;
    private readonly string _passphrase;
    private readonly string _notifyUrl;
    private readonly string _returnUrl;
    private readonly string _cancelUrl;

    public PayFastPaymentGateway(IConfiguration config)
    {
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

        _notifyUrl = config["PayFast:NotifyUrl"] ?? "";
        _returnUrl = config["PayFast:ReturnUrl"] ?? "";
        _cancelUrl = config["PayFast:CancelUrl"] ?? "";
    }

    public TransactionRequestDto CreatePaymentRequest(
        Guid reservationId,
        string listingTitle,
        decimal amount,
        string buyerFirstName,
        string buyerEmail
    )
    {
        var fields = BuildFields(reservationId, listingTitle, amount, buyerFirstName, buyerEmail);
        var signature = GenerateSignature(fields);

        var fieldsWithSign = new Dictionary<string, string>(fields) { ["signature"] = signature };

        return new TransactionRequestDto(_sandboxUrl, fieldsWithSign);
    }

    private List<KeyValuePair<string, string>> BuildFields(
        Guid reservationId,
        string listingTitle,
        decimal price,
        string buyerFirstName,
        string buyerEmail
    )
    {
        var fields = new List<KeyValuePair<string, string>>
        {
            new("merchant_id", _merchantId),
            new("merchant_key", _merchantKey),
            new("return_url", $"{_returnUrl}?reservationId={reservationId}"),
            new("cancel_url", $"{_cancelUrl}?reservationId={reservationId}"),
            new("notify_url", _notifyUrl),
            new("name_first", buyerFirstName ?? ""),
            new("email_address", buyerEmail ?? ""),
            new("m_payment_id", reservationId.ToString()),
            new("amount", price.ToString("F2", CultureInfo.InvariantCulture)),
            new("item_name", Truncate(listingTitle, 100)),
        };
        return fields.Where(f => !string.IsNullOrEmpty(f.Value)).ToList();
    }

    private string GenerateSignature(List<KeyValuePair<string, string>> fields)
    {
        var sb = new StringBuilder();

        foreach (var (key, value) in fields)
        {
            sb.Append($"{key}={PayFastEncode(value)}&");
        }

        if (!string.IsNullOrEmpty(_passphrase))
        {
            sb.Append($"passphrase={PayFastEncode(_passphrase)}");
        }
        else
        {
            sb.Length -= 1; // why is this wrong-->-1 is invalid cause it throws an out of range exception
        }

        using var md5 = MD5.Create();
        var hash = md5.ComputeHash(Encoding.UTF8.GetBytes(sb.ToString()));

        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static string Truncate(string value, int maxLength) =>
        value.Length <= maxLength ? value : value[..maxLength];

    public bool VerifySignature(string rawBody, string receivedSign)
    {
        var baseString = String.Join(
            "&",
            rawBody
                .Split('&', StringSplitOptions.RemoveEmptyEntries)
                .Where(p => !p.StartsWith("signature=", StringComparison.Ordinal))
        );
        if (!string.IsNullOrEmpty(_passphrase))
        {
            baseString += $"&passphrase={PayFastEncode(_passphrase)}";
        }
        using var md5 = MD5.Create();
        var hash = Convert
            .ToHexString(md5.ComputeHash(Encoding.UTF8.GetBytes(baseString)))
            .ToLowerInvariant();

        return hash == receivedSign.ToLowerInvariant();
    }

    private static string PayFastEncode(string value) =>
        Regex.Replace(
            HttpUtility.UrlEncode(value) ?? string.Empty,
            "%[0-9a-f]{2}",
            m => m.Value.ToUpperInvariant()
        );
}
