using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Modules.Identity;
using Modules.Identity.Models;
using Modules.Identity.Models.Dto;
using Modules.Identity.Models.DTO;
using Modules.Identity.Repositories;
using Modules.Identity.Verification;
using Modules.Listings;
using Modules.Listings.Repositories;
using Modules.Notifications;
using Modules.ReferenceData;
using Modules.ReferenceData.University;
using Modules.ReferenceData.University.Repositories;
using Moq;
using Xunit;
using UniversityDto = Modules.Identity.Models.DTO.University;
using UniversityEntity = Modules.ReferenceData.University.University;

namespace UniTrade.Tests.Unit.Modules;

[Trait("Category", "Unit")]
public class IdentityServiceTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<IUniversityRepository> _universityRepositoryMock;

    private readonly Mock<IListingRepository> _listingRepositoryMock;

    private readonly Mock<IConfiguration> _configMock;
    private readonly IdentityService _service;

    private readonly Mock<IVerificationRepository> _verificationRepositoryMock;
    private readonly Mock<IEmailService> _emailServiceMock;
    private readonly VerificationService _verificationService;

    public IdentityServiceTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _universityRepositoryMock = new Mock<IUniversityRepository>();
        _configMock = new Mock<IConfiguration>();
        _listingRepositoryMock = new Mock<IListingRepository>();

        _configMock
            .Setup(c => c["Jwt:Secret"])
            .Returns("super_secret_key_that_is_at_least_32_bytes_long_12345!!");
        _configMock.Setup(c => c["Otp:Secret"]).Returns("ut-otp-secret");
        _service = new IdentityService(
            _userRepositoryMock.Object,
            _universityRepositoryMock.Object,
            _listingRepositoryMock.Object,
            _configMock.Object
        );
        _verificationRepositoryMock = new Mock<IVerificationRepository>();
        _emailServiceMock = new Mock<IEmailService>();
        _verificationService = new VerificationService(
            _verificationRepositoryMock.Object,
            _userRepositoryMock.Object,
            _emailServiceMock.Object,
            _configMock.Object
        );
    }

    [Fact]
    public async Task RegisterAsync_ShouldSucceed_WhenDataIsValid()
    {
        var dto = new RegisterDto
        {
            Email = "219001234@uni.ac.za",
            Password = "SecurePassword123!",
            YearOfStudy = 3,
            FirstName = "John",
            LastName = "Doe",
            PhoneNumber = "0123456789",
        };

        var mockUniversity = new UniversityEntity();

        _universityRepositoryMock
            .Setup(r => r.GetByDomainAsync("uni.ac.za"))
            .ReturnsAsync(mockUniversity);
        _userRepositoryMock
            .Setup(r => r.GetByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((User?)null);
        _userRepositoryMock.Setup(r => r.AddAsync(It.IsAny<User>())).Returns(Task.CompletedTask);

        var result = await _service.RegisterAsync(dto);

        Assert.NotNull(result);
        Assert.Equal("219001234@uni.ac.za", result.Email);
        Assert.Equal("student", result.Role);
        Assert.NotNull(result.StudentProfile);
        Assert.Equal("219001234", result.StudentProfile.StudentNumber);
        Assert.Equal(3, result.StudentProfile.YearOfStudy);

        _userRepositoryMock.Verify(r => r.AddAsync(It.IsAny<User>()), Times.Once);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("short")]
    [InlineData("NoDigitsOrSpecial")]
    [InlineData("WithDigits12345")]
    [InlineData("WithSpecial!@#")]
    [InlineData("lowercase123!")]
    [InlineData("UPPERCASE123!")]
    public async Task RegisterAsync_ShouldThrowException_WhenPasswordIsWeak(string? weakPassword)
    {
        var dto = new RegisterDto { Email = "test@uni.ac.za", Password = weakPassword! };

        var ex = await Assert.ThrowsAsync<IdentityException>(() => _service.RegisterAsync(dto));
        Assert.Equal("weak_password", ex.Message);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("plainTextNoAtSign")]
    [InlineData("double@@signs.com")]
    [InlineData("@nodisplayname.com")]
    public async Task RegisterAsync_ShouldThrowException_WhenEmailFormatIsInvalid(
        string? invalidEmail
    )
    {
        var dto = new RegisterDto { Email = invalidEmail!, Password = "ValidPassword123!" };

        var ex = await Assert.ThrowsAsync<IdentityException>(() => _service.RegisterAsync(dto));
        Assert.Equal("invalid_email", ex.Message);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(11)]
    public async Task RegisterAsync_ShouldThrowException_WhenYearOfStudyIsOutOfBounds(
        int invalidYear
    )
    {
        var dto = new RegisterDto
        {
            Email = "dev@uni.ac.za",
            Password = "ValidPassword123!",
            YearOfStudy = invalidYear,
        };

        var ex = await Assert.ThrowsAsync<IdentityException>(() => _service.RegisterAsync(dto));
        Assert.Equal("invalid_year_of_study", ex.Message);
    }

    [Fact]
    public async Task RegisterAsync_ShouldThrowException_WhenUniversityDomainIsUnsupported()
    {
        var dto = new RegisterDto
        {
            Email = "user@unsupported.com",
            Password = "ValidPassword123!",
            YearOfStudy = 2,
        };
        _universityRepositoryMock
            .Setup(r => r.GetByDomainAsync("unsupported.com"))
            .ReturnsAsync((UniversityEntity?)null);

        var ex = await Assert.ThrowsAsync<IdentityException>(() => _service.RegisterAsync(dto));
        Assert.Equal("invalid_domain", ex.Message);
    }

    [Theory]
    [InlineData("verified", "email_taken")]
    [InlineData("pending", "otp_already_sent")]
    [InlineData("unknown_status", "email_taken")]
    public async Task RegisterAsync_ShouldThrowCorrectException_WhenEmailIsAlreadyTaken(
        string verificationStatus,
        string expectedMsg
    )
    {
        var dto = new RegisterDto
        {
            Email = "existing@uni.ac.za",
            Password = "ValidPassword123!",
            YearOfStudy = 1,
        };

        var mockUniversity = new UniversityEntity();
        var existingUser = new User
        {
            Email = "existing@uni.ac.za",
            StudentProfile = new StudentProfile { VerificationStatus = verificationStatus },
        };

        _universityRepositoryMock
            .Setup(r => r.GetByDomainAsync("uni.ac.za"))
            .ReturnsAsync(mockUniversity);
        _userRepositoryMock
            .Setup(r => r.GetByEmailAsync("existing@uni.ac.za"))
            .ReturnsAsync(existingUser);

        var ex = await Assert.ThrowsAsync<IdentityException>(() => _service.RegisterAsync(dto));
        Assert.Equal(expectedMsg, ex.Message);
    }

    [Fact]
    public async Task RegisterAsync_ShouldThrowEmailTakenException_WhenDbUpdateExceptionOccurs()
    {
        var dto = new RegisterDto
        {
            Email = "conflict@uni.ac.za",
            Password = "ValidPassword123!",
            YearOfStudy = 1,
        };
        var mockUniversity = new UniversityEntity();

        _universityRepositoryMock
            .Setup(r => r.GetByDomainAsync("uni.ac.za"))
            .ReturnsAsync(mockUniversity);
        _userRepositoryMock
            .Setup(r => r.GetByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((User?)null);
        _userRepositoryMock
            .Setup(r => r.AddAsync(It.IsAny<User>()))
            .ThrowsAsync(new DbUpdateException());

        var ex = await Assert.ThrowsAsync<IdentityException>(() => _service.RegisterAsync(dto));
        Assert.Equal("email_taken", ex.Message);
    }

    [Theory]
    [InlineData(null, "ValidPassword123!")]
    [InlineData("user@uni.ac.za", null)]
    [InlineData("   ", "ValidPassword123!")]
    public async Task LoginAsync_ShouldThrowException_WhenInputsAreMissing(
        string? email,
        string? password
    )
    {
        var request = new LoginDto { Email = email, Password = password };

        var ex = await Assert.ThrowsAsync<IdentityException>(() => _service.LoginAsync(request));
        Assert.Equal("invalid_credentials", ex.Message);
    }

    [Fact]
    public async Task LoginAsync_ShouldThrowException_WhenUserDoesNotExist()
    {
        var request = new LoginDto { Email = "missing@uni.ac.za", Password = "ValidPassword123!" };
        _userRepositoryMock
            .Setup(r => r.GetByEmailAsync("missing@uni.ac.za"))
            .ReturnsAsync((User?)null);

        var ex = await Assert.ThrowsAsync<IdentityException>(() => _service.LoginAsync(request));
        Assert.Equal("invalid_credentials", ex.Message);
    }

    [Fact]
    public async Task LoginAsync_ShouldThrowException_WhenPasswordVerificationFails()
    {
        var request = new LoginDto { Email = "test@uni.ac.za", Password = "WrongPassword123!" };
        var existingUser = new User
        {
            Email = "test@uni.ac.za",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("CorrectPassword123!"),
        };
        _userRepositoryMock
            .Setup(r => r.GetByEmailAsync("test@uni.ac.za"))
            .ReturnsAsync(existingUser);

        var ex = await Assert.ThrowsAsync<IdentityException>(() => _service.LoginAsync(request));
        Assert.Equal("invalid_credentials", ex.Message);
    }

    [Fact]
    public async Task LoginAsync_ShouldReturnJwtToken_WhenStudentCredentialsAreValid()
    {
        var request = new LoginDto
        {
            Email = "student@uni.ac.za",
            Password = "CorrectPassword123!",
        };
        var existingUser = new User
        {
            UserId = Guid.NewGuid(),
            Email = "student@uni.ac.za",
            Role = "student",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("CorrectPassword123!"),
            StudentProfile = new StudentProfile { VerificationStatus = "verified" },
        };
        _userRepositoryMock
            .Setup(r => r.GetByEmailAsync("student@uni.ac.za"))
            .ReturnsAsync(existingUser);

        var token = await _service.LoginAsync(request);

        Assert.NotNull(token);
        Assert.NotEmpty(token);
    }

    [Fact]
    public async Task LoginAsync_ShouldReturnJwtToken_WhenAdminCredentialsAreValid()
    {
        var request = new LoginDto { Email = "admin@uni.ac.za", Password = "CorrectPassword123!" };
        var existingUser = new User
        {
            UserId = Guid.NewGuid(),
            Email = "admin@uni.ac.za",
            Role = "admin",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("CorrectPassword123!"),
        };
        _userRepositoryMock
            .Setup(r => r.GetByEmailAsync("admin@uni.ac.za"))
            .ReturnsAsync(existingUser);

        var token = await _service.LoginAsync(request);

        Assert.NotNull(token);
        Assert.NotEmpty(token);
    }

    [Fact]
    public async Task LoginAsync_ShouldThrowException_WhenJwtSecretIsMissingConfig()
    {
        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["Jwt:Secret"]).Returns((string?)null);

        var testService = new IdentityService(
            _userRepositoryMock.Object,
            _universityRepositoryMock.Object,
            _listingRepositoryMock.Object,
            configMock.Object
        );

        var request = new LoginDto { Email = "admin@uni.ac.za", Password = "CorrectPassword123!" };
        var existingUser = new User
        {
            UserId = Guid.NewGuid(),
            Email = "admin@uni.ac.za",
            Role = "admin",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("CorrectPassword123!"),
        };
        _userRepositoryMock
            .Setup(r => r.GetByEmailAsync("admin@uni.ac.za"))
            .ReturnsAsync(existingUser);

        await Assert.ThrowsAsync<InvalidOperationException>(() => testService.LoginAsync(request));
    }

    [Fact]
    public async Task GetUserByEmailAsync_ShouldNormalizeInputStrings()
    {
        var rawEmail = "  sOmEoNe@uNi.Ac.Za  ";
        var cleanEmail = "someone@uni.ac.za";
        var mockUser = new User { Email = cleanEmail };

        _userRepositoryMock.Setup(r => r.GetByEmailAsync(cleanEmail)).ReturnsAsync(mockUser);

        var result = await _service.GetUserByEmailAsync(rawEmail);

        Assert.NotNull(result);
        Assert.Equal(cleanEmail, result.Email);
    }

    [Fact]
    public async Task GetMeAsync_ShouldThrowNotFound_WhenUserDoesNotExist()
    {
        var id = Guid.NewGuid().ToString();
        _userRepositoryMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((User?)null);

        var ex = await Assert.ThrowsAsync<IdentityException>(() => _service.GetMeAsync(id));
        Assert.Equal("not_found", ex.Message);
    }

    [Fact]
    public async Task GetMeAsync_ShouldReturnStudentNestedData_WhenRoleIsStudent()
    {
        var userId = Guid.NewGuid();
        var student = new User
        {
            UserId = userId,
            FirstName = "Alice",
            LastName = "Smith",
            Email = "alice@uni.ac.za",
            Role = "student",
            StudentProfile = new StudentProfile { VerificationStatus = "verified" },
        };

        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(student);

        var result = await _service.GetMeAsync(userId.ToString());

        Assert.NotNull(result);

        var userProp = result.GetType().GetProperty("User")?.GetValue(result, null) as UserDto;
        var stdProp = result.GetType().GetProperty("Std")?.GetValue(result, null) as StudentDto;

        Assert.NotNull(userProp);
        Assert.NotNull(stdProp);
        Assert.Equal("Alice", userProp.FirstName);
        Assert.Equal("student", userProp.UserRole);
        Assert.Equal("verified", stdProp.VerificationStatus);
    }

    [Fact]
    public async Task GetMeAsync_ShouldReturnUserDtoPlain_WhenRoleIsNotStudent()
    {
        var userId = Guid.NewGuid();
        var admin = new User
        {
            UserId = userId,
            FirstName = "Bob",
            LastName = "Manager",
            Email = "bob@uni.ac.za",
            Role = "admin",
        };

        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(admin);

        var result = await _service.GetMeAsync(userId.ToString());

        Assert.NotNull(result);
        var dto = Assert.IsType<UserDto>(result);
        Assert.Equal("Bob", dto.FirstName);
        Assert.Equal("bob@uni.ac.za", dto.Email);
    }

    [Theory]
    [InlineData("u12345678@tuks.co.za", "u12345678@tuks.co.za")]
    [InlineData("u12345678\uff20tuks.co.za", "u12345678@tuks.co.za")]
    [InlineData("u123\u200b45678@tuks.co.za", "u12345678@tuks.co.za")]
    [InlineData("u12345678\u2060@tuks.co.za", "u12345678@tuks.co.za")]
    [InlineData("\ufeffu12345678@tuks.co.za", "u12345678@tuks.co.za")]
    public void NormaliseEmail_folds_and_strips(string input, string expected)
    {
        Assert.Equal(expected, IdentityService.NormaliseEmail(input));
    }

    [Theory]
    [InlineData("tuks\uff0eco\uff0eza", "tuks.co.za")]
    [InlineData("tuks\u3002co\u3002za", "tuks.co.za")]
    [InlineData("tuks\uff61co\uff61za", "tuks.co.za")]
    [InlineData("tuks.co.za", "tuks.co.za")]
    public void NormaliseEmail_FoldsDotHomoglyphs(string input, string expected)
    {
        Assert.Equal(expected, IdentityService.NormaliseDomain(input));
    }

    [Fact]
    public async Task RegisterAsync_RejectsHomoglyphEmail_WhenRealDomainNotWhitelisted()
    {
        var dto = ARegisterDto("u12345678@tuks\uff0eco.za");
        _universityRepositoryMock
            .Setup(r => r.GetByDomainAsync("tuks.co.za"))
            .ReturnsAsync((UniversityEntity?)null);
        _userRepositoryMock
            .Setup(r => r.GetByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((User?)null);

        var exception = await Assert.ThrowsAsync<IdentityException>(() =>
            _service.RegisterAsync(dto)
        );

        Assert.Equal("invalid_domain", exception.Message);
        _userRepositoryMock.Verify(r => r.AddAsync(It.IsAny<User>()), Times.Never);
    }

    [Theory]
    [InlineData("u12345678\uff20tuks.co.za")]
    [InlineData("u12345678@tuks\uff0eco\uff0eza")]
    [InlineData("u12345678@tuks\u3002co\u3002za")]
    [InlineData("u12345678@tuks\uff61co\uff61za")]
    [InlineData("u1234\u200b5678@tuks.co.za")]
    [InlineData("u12345678@TuKs.Co.Za")]
    public async Task RegisterAsync_FoldsHomoglyphEmail_AndResolvesToRealUniversity(
        string dirtyEmail
    )
    {
        _universityRepositoryMock
            .Setup(r => r.GetByDomainAsync("tuks.co.za"))
            .ReturnsAsync(new UniversityEntity());
        _userRepositoryMock
            .Setup(r => r.GetByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((User?)null);
        _userRepositoryMock.Setup(r => r.AddAsync(It.IsAny<User>())).Returns(Task.CompletedTask);

        var result = await _service.RegisterAsync(ARegisterDto(dirtyEmail));

        Assert.Equal("u12345678@tuks.co.za", result.Email);
        Assert.Equal("u12345678", result.StudentProfile!.StudentNumber);
        _universityRepositoryMock.Verify(r => r.GetByDomainAsync("tuks.co.za"), Times.Once);
    }

    [Fact]
    public async Task RegisterAsync_NfcNormalisesDecomposedCharacters_BeforePunycode()
    {
        _universityRepositoryMock
            .Setup(r => r.GetByDomainAsync("xn--tuk-eza.co.za"))
            .ReturnsAsync(new UniversityEntity());
        _userRepositoryMock
            .Setup(r => r.GetByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((User?)null);
        _userRepositoryMock.Setup(r => r.AddAsync(It.IsAny<User>())).Returns(Task.CompletedTask);

        await _service.RegisterAsync(ARegisterDto("u12345678@tuks\u0301.co.za"));

        _universityRepositoryMock.Verify(r => r.GetByDomainAsync("xn--tuk-eza.co.za"), Times.Once);
    }

    [Fact]
    public async Task RegisterAsync_ConvertsUnicodeDomainToPunycode_ForAllowListLookup()
    {
        var dto = ARegisterDto("u12345678@tuk\u015B.co.za");

        _universityRepositoryMock
            .Setup(r => r.GetByDomainAsync("xn--tuk-eza.co.za"))
            .ReturnsAsync(new UniversityEntity());
        _userRepositoryMock
            .Setup(r => r.GetByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((User?)null);
        _userRepositoryMock.Setup(r => r.AddAsync(It.IsAny<User>())).Returns(Task.CompletedTask);

        var result = await _service.RegisterAsync(dto);

        Assert.Equal("u12345678@tuk\u015B.co.za", result.Email);
        _universityRepositoryMock.Verify(r => r.GetByDomainAsync("xn--tuk-eza.co.za"), Times.Once);
    }

    [Theory]
    [InlineData(1, 2)]
    [InlineData(2, 4)]
    [InlineData(3, 8)]
    [InlineData(5, 32)]
    [InlineData(8, 256)]
    [InlineData(10, 900)]
    [InlineData(11, 900)]
    public async Task VerifyAsync_AppliesExponentialBackoff_WhenRetryimhWIthinWindow(
        int prevFailureCount,
        int expectedDelaySeconds
    )
    {
        var record = FailingReqRecord(
            totalAttempts: prevFailureCount,
            lastAttempt: DateTime.UtcNow
        );
        _verificationRepositoryMock
            .Setup(r => r.GetCurrentByUserIdAsync(record.UserId))
            .ReturnsAsync(record);

        var exception = await Assert.ThrowsAsync<VerificationException>(() =>
            _verificationService.VerifyAsync(record.UserId, "000000")
        );

        var parts = exception.Message.Split(':');
        Assert.Equal("too_many_attempts", parts[0]);

        var waitSeconds = int.Parse(parts[1]);
        Assert.InRange(waitSeconds, expectedDelaySeconds - 1, expectedDelaySeconds);
        _verificationRepositoryMock.Verify(
            r => r.UpdateAsync(It.IsAny<VerificationRequest>()),
            Times.Never
        );
    }

    [Fact]
    public async Task VerifyAsync_AppliesNoDelayWhenNoPriorFailures()
    {
        var record = FailingReqRecord(totalAttempts: 0, lastAttempt: DateTime.UtcNow);
        _verificationRepositoryMock
            .Setup(r => r.GetCurrentByUserIdAsync(record.UserId))
            .ReturnsAsync(record);

        var exception = await Assert.ThrowsAsync<VerificationException>(() =>
            _verificationService.VerifyAsync(record.UserId, "000000")
        );

        Assert.Equal("invalid_otp", exception.Message);
        Assert.Equal(1, record.AttemptNumber);

        _verificationRepositoryMock.Verify(r => r.UpdateAsync(record), Times.Once);
    }

    [Fact]
    public async Task VerifyAsync_DelayNeverExceeds15Minutes_WhenFauilureCountsAreHigh()
    {
        var record = FailingReqRecord(totalAttempts: 40, lastAttempt: DateTime.UtcNow);
        _verificationRepositoryMock
            .Setup(r => r.GetCurrentByUserIdAsync(record.UserId))
            .ReturnsAsync(record);

        var exception = await Assert.ThrowsAsync<VerificationException>(() =>
            _verificationService.VerifyAsync(record.UserId, "000000")
        );

        var waitSeconds = int.Parse(exception.Message.Split(':')[1]);
        Assert.InRange(waitSeconds, 899, 900);
    }

    [Fact]
    public async Task ResendAsync_ResetsPreOtpAttempts_ButPreservesCumulatoveBackoff()
    {
        var record = new VerificationRequest
        {
            UserId = Guid.NewGuid(),
            OtpVerifiedAt = null,
            OtpSentAt = DateTime.UtcNow.AddMinutes(-5),
            AttemptNumber = 2,
            TotalAttemptCount = 5,
            OtpResendCount = 0,
        };

        _verificationRepositoryMock
            .Setup(r => r.GetCurrentByUserIdAsync(record.UserId))
            .ReturnsAsync(record);
        _verificationRepositoryMock
            .Setup(r => r.UpdateAsync(It.IsAny<VerificationRequest>()))
            .Returns(Task.CompletedTask);
        _emailServiceMock
            .Setup(e => e.SendOtpEmailAsync(It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        await _verificationService.ResendAsync(record.UserId, "u12345678@tuks.co.za");
        Assert.Equal(0, record.AttemptNumber);
        Assert.Equal(5, record.TotalAttemptCount!.Value);
    }

    [Fact]
    public async Task ResendAsync_Throws_WhenWIthinCooldown()
    {
        var record = new VerificationRequest
        {
            UserId = Guid.NewGuid(),
            OtpVerifiedAt = null,
            OtpSentAt = DateTime.UtcNow.AddSeconds(-10),
        };
        _verificationRepositoryMock
            .Setup(r => r.GetCurrentByUserIdAsync(record.UserId))
            .ReturnsAsync(record);

        var exception = await Assert.ThrowsAsync<VerificationException>(() =>
            _verificationService.ResendAsync(record.UserId, "u12345678@tuks.co.za")
        );
        Assert.Equal("cooldown_active", exception.Message);
    }

    private static RegisterDto ARegisterDto(string email) =>
        new()
        {
            Email = email,
            Password = "SafePassword78(*)",
            YearOfStudy = 3,
            FirstName = "Registerer",
            LastName = "RegistersLName",
            PhoneNumber = "0773882746",
            DegreeProgram = "Computer Science",
        };

    private static VerificationRequest FailingReqRecord(
        int totalAttempts,
        DateTime lastAttempt,
        int attemptNumber = 0
    ) =>
        new()
        {
            UserId = Guid.NewGuid(),
            OtpCodeHash = Convert.ToBase64String(new byte[32]),
            OtpExpiresAt = DateTime.UtcNow.AddMinutes(5),
            OtpVerifiedAt = null,
            AttemptNumber = attemptNumber,
            TotalAttemptCount = totalAttempts,
            LastAttemptAt = lastAttempt,
            Status = "otp_pending",
            IsCurrent = true,
        };
}
