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
using Modules.Listings;
using Modules.Listings.Repositories;
using Modules.Notifications;
using Modules.ReferenceData;
using Modules.ReferenceData.University;
using Modules.ReferenceData.University.Repositories;
using Moq;
using Xunit;

namespace Api.Tests.Services;

[Trait("Category", "Unit")]
public class IdentityServiceTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<IUniversityRepository> _universityRepositoryMock;

    private readonly Mock<IListingRepository> _listingRepositoryMock;

    private readonly Mock<IConfiguration> _configMock;
    private readonly IdentityService _service;

    public IdentityServiceTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _universityRepositoryMock = new Mock<IUniversityRepository>();
        _configMock = new Mock<IConfiguration>();
        _listingRepositoryMock = new Mock<IListingRepository>();

        _configMock
            .Setup(c => c["Jwt:Secret"])
            .Returns("super_secret_key_that_is_at_least_32_bytes_long_12345!!");

        _service = new IdentityService(
            _userRepositoryMock.Object,
            _universityRepositoryMock.Object,
            _listingRepositoryMock.Object,
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

        var mockUniversity = new Modules.ReferenceData.University.University();

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
            .ReturnsAsync((Modules.ReferenceData.University.University?)null);

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

        var mockUniversity = new Modules.ReferenceData.University.University();
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
        var mockUniversity = new Modules.ReferenceData.University.University();

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
}
