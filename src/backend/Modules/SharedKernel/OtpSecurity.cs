using System.Security.Cryptography;
using System.Text;

namespace Modules.SharedKernel;

public static class OtpSecurity
{
    public static string HashOtp(string otp, string pepper)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(pepper));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(otp));
        return Convert.ToBase64String(hash);
    }

    public static bool VerifyOtp(string otp, string storedHash, string pepper)
    {
        byte[] storedBytes;
        try
        {
            storedBytes = Convert.FromBase64String(storedHash);
        }
        catch (FormatException)
        {
            return false;
        }
        var computedHash = HashOtp(otp, pepper);
        return CryptographicOperations.FixedTimeEquals(
            Convert.FromBase64String(computedHash),
            Convert.FromBase64String(storedHash)
        );
    }
}
