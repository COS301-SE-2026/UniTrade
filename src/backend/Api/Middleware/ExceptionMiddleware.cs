using System.Net;
using System.Text.Json;

namespace Api.Middleware;

public class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
{
    private readonly RequestDelegate _next = next;
    private readonly ILogger<ExceptionMiddleware> _logger = logger;

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var response = context.Response;
        response.ContentType = "application/json";

        var exceptionMessage = exception.Message;
        int? retryAfter = null;
        if (exceptionMessage.StartsWith("too_many_attempts:", StringComparison.Ordinal))
        {
            var parts = exceptionMessage.Split(':');
            if (parts.Length == 2 && int.TryParse(parts[1], out var secs))
            {
                retryAfter = secs;
            }
            exceptionMessage = "too_many_attempts";
        }
        var (statusCode, error) = exceptionMessage switch
        {
            // for registration and login
            "email_taken" => (HttpStatusCode.Conflict, "email_taken"),
            "invalid_credentials" => (HttpStatusCode.Unauthorized, "invalid_credentials"),
            "invalid_domain" => (HttpStatusCode.UnprocessableEntity, "invalid_domain"),
            "weak_password" => (HttpStatusCode.UnprocessableEntity, "weak_password"),
            "invalid_email" => (HttpStatusCode.UnprocessableEntity, "invalid_email"),
            "invalid_year_of_study" => (
                HttpStatusCode.UnprocessableEntity,
                "invalid_year_of_study"
            ),

            // OTP verify / resend
            "invalid_otp" => (HttpStatusCode.Unauthorized, "invalid_otp"),
            "otp_expired" => (HttpStatusCode.Unauthorized, "otp_expired"),
            "otp_invalidated_resend_required" => (
                HttpStatusCode.TooManyRequests,
                "otp_invalidated_resend_required"
            ),
            "too_many_attempts" => (HttpStatusCode.TooManyRequests, "too_many_attempts"),
            "already_verified" => (HttpStatusCode.Conflict, "already_verified"),
            "invalid_request" => (HttpStatusCode.BadRequest, "invalid_request"),
            "resend_limit_exceeded" => (HttpStatusCode.TooManyRequests, "resend_limit_exceeded"),
            "cooldown_active" => (HttpStatusCode.TooManyRequests, "cooldown_active"),

            // listings / auth
            "verification_required" => (HttpStatusCode.Forbidden, "verification_required"),
            "listing_not_found" => (HttpStatusCode.NotFound, "listing_not_found"),
            "not_found" => (HttpStatusCode.NotFound, "not_found"),
            "forbidden" => (HttpStatusCode.Forbidden, "forbidden"),
            "invalid_category" => (HttpStatusCode.UnprocessableEntity, "invalid_category"),
            "invalid_metadata" => (HttpStatusCode.UnprocessableEntity, "invalid_metadata"),
            "metadata_not_allowed" => (HttpStatusCode.UnprocessableEntity, "metadata_not_allowed"),
            "book_fields_not_allowed" => (
                HttpStatusCode.UnprocessableEntity,
                "book_fields_not_allowed"
            ),
            "unauthenticated" => (HttpStatusCode.Unauthorized, "unauthenticated"),

            // for courses
            "course_not_found" => (HttpStatusCode.NotFound, "course_not_found"),
            // unmapped -> ultra generic
            _ => (HttpStatusCode.InternalServerError, "server_error"),
        };

        if (statusCode == HttpStatusCode.InternalServerError)
        {
            _logger.LogError(exception, "Unhandled exception: {Message}", exception.Message);
        }
        response.StatusCode = (int)statusCode;

        var result = JsonSerializer.Serialize(
            new { error = error, retry_after_seconds = retryAfter }
        );

        await response.WriteAsync(result);
    }
}
