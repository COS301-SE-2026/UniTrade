using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Api.Controllers;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Modules.Identity;
using Modules.Identity.Models;
using Modules.Identity.Models.Dto;
using Modules.Identity.Models.DTO;
using Modules.Identity.Verification;
using Moq;
using Xunit;

namespace Api.Tests.Controllers;

public class AuthControllerTests
{
    private readonly Mock<IIdentityService> _identityServiceMock;
    private readonly Mock<IVerificationService> _verificationServiceMock;
    private readonly AuthController _controller;
    private readonly Mock<HttpContext> _httpContextMock;
    private readonly Mock<HttpResponse> _httpResponseMock;
    private readonly Mock<IResponseCookies> _responseCookiesMock;
    private readonly Mock<IWebHostEnvironment> _envMock;

    public AuthControllerTests()
    {
        _identityServiceMock = new Mock<IIdentityService>();
        _verificationServiceMock = new Mock<IVerificationService>();
        _envMock = new Mock<IWebHostEnvironment>();
        _envMock.Setup(e => e.EnvironmentName).Returns("Production");

        // Setup controller instance
        _controller = new AuthController(
            _identityServiceMock.Object,
            _verificationServiceMock.Object,
            _envMock.Object
        );

        // Setup common HTTP Context structures for Cookie/User access
        _httpContextMock = new Mock<HttpContext>();
        _httpResponseMock = new Mock<HttpResponse>();
        _responseCookiesMock = new Mock<IResponseCookies>();

        _httpResponseMock.Setup(r => r.Cookies).Returns(_responseCookiesMock.Object);
        _httpContextMock.Setup(c => c.Response).Returns(_httpResponseMock.Object);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = _httpContextMock.Object,
        };
    }

    #region Register Tests

    [Fact]
    public async Task Register_ShouldReturnOk_WhenRegistrationSucceeds()
    {
        // Arrange
        var dto = new RegisterDto 
        { Email = "test@uni.ac.za", 
        Password = "StrongPassword1!",
        TermsAcceptedAt = DateTime.UtcNow 
        };
        var createdUser = new User { UserId = Guid.NewGuid(), Email = dto.Email };

        _identityServiceMock.Setup(s => s.RegisterAsync(dto)).ReturnsAsync(createdUser);

        _verificationServiceMock
            .Setup(s => s.InitiateAsync(createdUser.Email, createdUser.UserId))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.Register(dto);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);

        var resultData = okResult.Value;
        var messageProp = resultData?.GetType().GetProperty("message")?.GetValue(resultData, null);
        Assert.Equal("OTP sent to your email.", messageProp);

        _verificationServiceMock.Verify(
            s => s.InitiateAsync(createdUser.Email, createdUser.UserId),
            Times.Once
        );
    }

    [Theory]
    [InlineData("weak_password", 422, "weak_password")]
    [InlineData("email_taken", 409, "email_taken")]
    [InlineData("otp_already_sent", 429, "otp_already_sent")]
    [InlineData("unknown_error", 500, "server_error")]
    public async Task Register_ShouldReturnCorrectStatusCode_WhenServiceThrowsException(
        string serviceExceptionMessage,
        int expectedStatusCode,
        string expectedErrorProp
    )
    {
        // Arrange
        var dto = new RegisterDto 
        { Email = "test@uni.ac.za",
        Password = "StrongPassword1!",
        TermsAcceptedAt = DateTime.UtcNow };
        _identityServiceMock
            .Setup(s => s.RegisterAsync(dto))
            .ThrowsAsync(new Exception(serviceExceptionMessage));

        // Act
        var result = await _controller.Register(dto);

        // Assert
        // Safe check using pattern matching to avoid strict class hierarchies causing xUnit validation errors
        Assert.NotNull(result);
        var objectResult = Assert.IsType<ObjectResult>(result, exactMatch: false);
        Assert.Equal(expectedStatusCode, objectResult.StatusCode);

        var resultData = objectResult.Value;
        var errorProp = resultData?.GetType().GetProperty("error")?.GetValue(resultData, null);
        Assert.Equal(expectedErrorProp, errorProp);
    }

    #endregion

    #region Verify OTP Tests

    [Fact]
    public async Task VerifyOtp_ShouldReturnUnauthorized_WhenUserDoesNotExist()
    {
        // Arrange
        var dto = new VerifyOtpDto { Email = "notfound@uni.ac.za", Otp = "123456" };

        _identityServiceMock.Setup(s => s.GetUserByEmailAsync(dto.Email)).ReturnsAsync((User?)null);

        // Act
        var result = await _controller.VerifyOtp(dto);

        // Assert
        var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result);
        var resultData = unauthorizedResult.Value;
        var errorProp = resultData?.GetType().GetProperty("error")?.GetValue(resultData, null);
        Assert.Equal("invalid_otp", errorProp);
    }

    [Fact]
    public async Task VerifyOtp_ShouldReturnOk_WhenOtpIsValid()
    {
        // Arrange
        var dto = new VerifyOtpDto { Email = "test@uni.ac.za", Otp = "123456" };
        var mockUser = new User { UserId = Guid.NewGuid(), Email = dto.Email };

        _identityServiceMock.Setup(s => s.GetUserByEmailAsync(dto.Email)).ReturnsAsync(mockUser);
        _verificationServiceMock
            .Setup(s => s.VerifyAsync(mockUser.UserId, dto.Otp))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.VerifyOtp(dto);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var resultData = okResult.Value;
        var messageProp = resultData?.GetType().GetProperty("message")?.GetValue(resultData, null);
        Assert.Equal("Verified successfully.", messageProp);
    }

    #endregion

    #region Resend OTP Tests

    [Fact]
    public async Task ResendOtp_ShouldReturnOk_EvenIfUserDoesNotExistToPreventEnumeration()
    {
        // Arrange
        var dto = new ResendOtpDto { Email = "ghost@uni.ac.za" };

        _identityServiceMock.Setup(s => s.GetUserByEmailAsync(dto.Email)).ReturnsAsync((User?)null);

        // Act
        var result = await _controller.ResendOtp(dto);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var resultData = okResult.Value;
        var messageProp = resultData
            ?.GetType()
            .GetProperty("message")
            ?.GetValue(resultData, null)
            ?.ToString();

        Assert.NotNull(messageProp);
        Assert.Contains("If this email is registered", messageProp);
    }

    #endregion

    #region Login & Logout Tests

    [Fact]
    public async Task Login_ShouldSetCookieAndReturnOk_WhenCredentialsAreValid()
    {
        // Arrange
        var request = new LoginDto { Email = "test@uni.ac.za", Password = "ValidPassword1!" };
        var fakeJwtToken = "fake.jwt.token";

        _identityServiceMock.Setup(s => s.LoginAsync(request)).ReturnsAsync(fakeJwtToken);

        // Act
        var result = await _controller.Login(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var resultData = okResult.Value;
        var messageProp = resultData?.GetType().GetProperty("message")?.GetValue(resultData, null);
        Assert.Equal("Login successful", messageProp);

        _responseCookiesMock.Verify(
            c =>
                c.Append(
                    "authToken",
                    fakeJwtToken,
                    It.Is<CookieOptions>(opts => opts.HttpOnly && opts.Path == "/")
                ),
            Times.Once
        );
    }

    [Fact]
    public void Logout_ShouldDeleteCookieAndReturnOk()
    {
        // Act
        var result = _controller.Logout();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var resultData = okResult.Value;
        var messageProp = resultData?.GetType().GetProperty("message")?.GetValue(resultData, null);
        Assert.Equal("Logged out successfully", messageProp);

        _responseCookiesMock.Verify(
            c => c.Delete("authToken", It.IsAny<CookieOptions>()),
            Times.Once
        );
    }

    #endregion

    #region GetMe Tests

    [Fact]
    public async Task GetMe_ShouldReturnProfileData_WhenUserHasValidClaims()
    {
        // Arrange
        var targetUserId = Guid.NewGuid().ToString();
        var mockProfileResponse = new { User = new { Email = "authenticated@uni.ac.za" } };

        var claims = new List<Claim> { new Claim(ClaimTypes.NameIdentifier, targetUserId) };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _httpContextMock.Setup(c => c.User).Returns(claimsPrincipal);
        _identityServiceMock
            .Setup(s => s.GetMeAsync(targetUserId))
            .ReturnsAsync(mockProfileResponse);

        // Act
        var result = await _controller.GetMe();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Same(mockProfileResponse, okResult.Value);
    }

    [Fact]
    public async Task GetMe_ShouldReturnUnauthorized_WhenNameIdentifierClaimIsMissing()
    {
        // Arrange an empty principal setup
        var claimsPrincipal = new ClaimsPrincipal(new ClaimsIdentity());
        _httpContextMock.Setup(c => c.User).Returns(claimsPrincipal);

        // Act
        var result = await _controller.GetMe();

        // Assert
        var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result);
        var resultData = unauthorizedResult.Value;
        var errorProp = resultData?.GetType().GetProperty("error")?.GetValue(resultData, null);
        Assert.Equal("unauthenticated", errorProp);
    }

    #endregion
}
