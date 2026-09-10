using Modules.SharedKernel;
using Xunit;

namespace UniTrade.Tests.Unit.Modules;

[Trait("Category", "Unit")]
public class OtpSecurityTests
{
    private const string _testPepper = "secret-pepper";
    private const string _testOtp = "123456";

    // pepper has tests (qr-03 c)
    [Fact]
    public void HashOtp_IsDeterministic_WithSameOtpAndPepper()
    {
        var hash1 = OtpSecurity.HashOtp(_testOtp, _testPepper);
        var hash2 = OtpSecurity.HashOtp(_testOtp, _testPepper);
        Assert.Equal(hash1, hash2);
    }

    [Fact]
    public void HashOtp_ProducesDifferentHash_WithDifferentPepper()
    {
        var pep1 = "pep1";
        var pep2 = "pep2";
        var hash1 = OtpSecurity.HashOtp(_testOtp, pep1);
        var hash2 = OtpSecurity.HashOtp(_testOtp, pep2);
        Assert.NotEqual(hash1, hash2);
    }

    [Fact]
    public void HashOtp_IsNotEqualToRawOtp()
    {
        var hash1 = OtpSecurity.HashOtp(_testOtp, _testPepper);
        Assert.NotEqual(_testOtp, hash1);
        Assert.DoesNotContain(_testOtp, hash1);
    }

    [Fact]
    public void VerifyOtp_Returns_True_ForCorrectOtp()
    {
        var hash1 = OtpSecurity.HashOtp(_testOtp, _testPepper);
        var result = OtpSecurity.VerifyOtp(_testOtp, hash1, _testPepper);
        Assert.True(result);
    }

    [Fact]
    public void VerifyOtp_Returns_False_ForWrongOtp()
    {
        var hash1 = OtpSecurity.HashOtp(_testOtp, _testPepper);
        var wrongOtp = "123455";
        var result = OtpSecurity.VerifyOtp(wrongOtp, hash1, _testPepper);
        Assert.False(result);
    }

    //constant time comparison tests (qr 03 c)
    [Theory]
    [InlineData("12345")]
    [InlineData("abcdef")]
    [InlineData("1234567")]
    [InlineData("000000")]
    [InlineData("123455")]
    [InlineData("223456")]
    public void VerifyOtp_RejectsWrongOtp_RegardlessOfLengthOrContent(string wrongOtp)
    {
        var hash = OtpSecurity.HashOtp(_testOtp, _testPepper);
        var result = OtpSecurity.VerifyOtp(wrongOtp, hash, _testPepper);
        Assert.False(result);
    }

    [Fact]
    public void VerifyOtp_Returns_False_OnMalformedStoredHash()
    {
        Assert.False(OtpSecurity.VerifyOtp(_testOtp, "ver-invalid-base64!", _testPepper));
    }
}
