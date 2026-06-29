export function getAuthErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    invalid_email: "Please enter a valid student email address.",
    invalid_domain: "Email domain is not a recognised SA university.",
    email_taken: "An account with this email already exists.",
    weak_password:
      "Password is too weak. Use at least 8 characters with at laest one capital letter, at least one special character and at least one number.",
    invalid_year_of_study: "Please enter a valid year of study.",
    otp_already_sent:
      "An OTP was already sent. Please wait before requesting another.",
    invalid_otp: "The OTP you entered is incorrect.",
    otp_expired: "Your OTP has expired. Please request a new one.",
    otp_invalidated_resend_required:
      "Too many incorrect attempts on this code. Please request another one.",
    too_many_attempts: "Too many attempts. Please request a new OTP.",
    invalid_credentials: "Incorrect email or password.",
    resend_limit_exceeded: "Too many resend attempts. Please wait 60 seconds.",
    cooldown_active: "Please wait 60 seconds before requesting another OTP.",
    server_error: "Something went wrong. Please try again.",
  };
  const base = code.startsWith("too_many_attempts")
    ? "too_many_attempts"
    : code;
  return messages[base] ?? "Something went wrong. Please try again.";
}
