namespace Modules.Identity.Models.Dto;

public class ForgotPasswordDto
{
    public string Email { get; set;} = null !;
}

public class VerifyResetDto 
{
    public string Email {get; set;} = null!;
    public string Otp {get; set;} = null!;
}

public class ResetPasswordDto
{
    public string Email { get; set; } = null!;
    public string Otp { get; set; } = null!;
    public string NewPassword { get; set; } = null!;
}