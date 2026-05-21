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
            _logger.LogError(ex, "Unhandled exception");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var response = context.Response;
        response.ContentType = "application/json";

        var (statusCode, message) = exception.Message switch
        {
            "email_taken"            => (HttpStatusCode.Conflict, "email_taken"),
            "otp_already_sent"       => (HttpStatusCode.TooManyRequests, "otp_already_sent"),
            "invalid_otp"            => (HttpStatusCode.Unauthorized, "invalid_otp"),
            "otp_expired"            => (HttpStatusCode.Unauthorized, "otp_expired"),
            "max_attempts_exceeded"  => (HttpStatusCode.TooManyRequests, "max_attempts_exceeded"),
            "resend_limit_exceeded"  => (HttpStatusCode.TooManyRequests, "resend_limit_exceeded"),
            "cooldown_active"        => (HttpStatusCode.TooManyRequests, "cooldown_active"),
            "verification_required"  => (HttpStatusCode.Forbidden, "verification_required"),
            "invalid_credentials"    => (HttpStatusCode.Unauthorized, "invalid_credentials"),
            "invalid_domain"         => (HttpStatusCode.UnprocessableEntity, "invalid_domain"),
            "weak_password"          => (HttpStatusCode.UnprocessableEntity, "weak_password"),
            "invalid_email"          => (HttpStatusCode.UnprocessableEntity, "invalid_email"),
            "listing_not_found"      => (HttpStatusCode.NotFound, "listing_not_found"),
            "forbidden"              => (HttpStatusCode.Forbidden, "forbidden"),
            _                        => (HttpStatusCode.InternalServerError, exception.Message),
        };

        response.StatusCode = (int)statusCode;

        var result = JsonSerializer.Serialize(new
        {
            error  = message,
            detail = exception.StackTrace
        });

        await response.WriteAsync(result);
    }
}