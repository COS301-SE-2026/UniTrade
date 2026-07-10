using System;
using System.IO;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Api.Middleware;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace UniTrade.Tests.Unit.Api.Middleware;

public class ExceptionMiddlewareTests
{
    private readonly Mock<ILogger<ExceptionMiddleware>> _logger;
    private readonly ExceptionMiddleware _sut;
    private readonly JsonSerializerOptions _jsonOptions;

    public ExceptionMiddlewareTests()
    {
        _logger = new Mock<ILogger<ExceptionMiddleware>>();
        _sut = new ExceptionMiddleware(_ => Task.CompletedTask, _logger.Object);
        _jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
    }

    [Theory]
    [InlineData("email_taken", HttpStatusCode.Conflict, "email_taken")]
    [InlineData("invalid_credentials", HttpStatusCode.Unauthorized, "invalid_credentials")]
    [InlineData("invalid_domain", HttpStatusCode.UnprocessableEntity, "invalid_domain")]
    [InlineData("weak_password", HttpStatusCode.UnprocessableEntity, "weak_password")]
    [InlineData("invalid_email", HttpStatusCode.UnprocessableEntity, "invalid_email")]
    [InlineData(
        "invalid_year_of_study",
        HttpStatusCode.UnprocessableEntity,
        "invalid_year_of_study"
    )]
    [InlineData("invalid_otp", HttpStatusCode.Unauthorized, "invalid_otp")]
    [InlineData("otp_expired", HttpStatusCode.Unauthorized, "otp_expired")]
    [InlineData(
        "otp_invalidated_resend_required",
        HttpStatusCode.TooManyRequests,
        "otp_invalidated_resend_required"
    )]
    [InlineData("too_many_attempts", HttpStatusCode.TooManyRequests, "too_many_attempts")]
    [InlineData("already_verified", HttpStatusCode.Conflict, "already_verified")]
    [InlineData("invalid_request", HttpStatusCode.BadRequest, "invalid_request")]
    [InlineData("resend_limit_exceeded", HttpStatusCode.TooManyRequests, "resend_limit_exceeded")]
    [InlineData("cooldown_active", HttpStatusCode.TooManyRequests, "cooldown_active")]
    [InlineData("verification_required", HttpStatusCode.Forbidden, "verification_required")]
    [InlineData("listing_not_found", HttpStatusCode.NotFound, "listing_not_found")]
    [InlineData("not_found", HttpStatusCode.NotFound, "not_found")]
    [InlineData("forbidden", HttpStatusCode.Forbidden, "forbidden")]
    [InlineData("invalid_category", HttpStatusCode.UnprocessableEntity, "invalid_category")]
    [InlineData("invalid_metadata", HttpStatusCode.UnprocessableEntity, "invalid_metadata")]
    [InlineData("metadata_not_allowed", HttpStatusCode.UnprocessableEntity, "metadata_not_allowed")]
    [InlineData(
        "book_fields_not_allowed",
        HttpStatusCode.UnprocessableEntity,
        "book_fields_not_allowed"
    )]
    [InlineData("unauthenticated", HttpStatusCode.Unauthorized, "unauthenticated")]
    [InlineData("course_not_found", HttpStatusCode.NotFound, "course_not_found")]
    public async Task HandleExceptionAsync_MapsKnownErrors(
        string errorMessage,
        HttpStatusCode expectedStatus,
        string expectedError
    )
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        var middleware = new ExceptionMiddleware(
            _ => throw new Exception(errorMessage),
            _logger.Object
        );

        await middleware.InvokeAsync(context);

        Assert.Equal((int)expectedStatus, context.Response.StatusCode);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var json = JsonSerializer.Deserialize<JsonElement>(body);

        Assert.Equal(expectedError, json.GetProperty("error").GetString());
    }

    [Fact]
    public async Task HandleExceptionAsync_Returns500_ForUnmappedException()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        var middleware = new ExceptionMiddleware(
            _ => throw new Exception("error that is unmapped"),
            _logger.Object
        );

        await middleware.InvokeAsync(context);

        Assert.Equal((int)HttpStatusCode.InternalServerError, context.Response.StatusCode);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var json = JsonSerializer.Deserialize<JsonElement>(body);

        Assert.Equal("server_error", json.GetProperty("error").GetString());
    }

    [Fact]
    public async Task HandleExceptionAsync_LogsError_ForInternalServerError()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        var logger = new Mock<ILogger<ExceptionMiddleware>>();
        var middleware = new ExceptionMiddleware(
            _ => throw new Exception("Unhandled Exception"),
            logger.Object
        );
        await middleware.InvokeAsync(context);
        Assert.Equal((int)HttpStatusCode.InternalServerError, context.Response.StatusCode);
        logger.Verify(
            x =>
                x.Log(
                    LogLevel.Error,
                    It.IsAny<EventId>(),
                    It.IsAny<It.IsAnyType>(),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()
                ),
            Times.Once
        );
    }

    [Theory]
    [InlineData("too_many_attempts:20")]
    [InlineData("too_many_attempts:invalid")]
    public async Task HandleExceptionAsync_Handles_TooManyAttemptsWithRetryAfter(
        string errorMessage
    )
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        var middleware = new ExceptionMiddleware(
            _ => throw new Exception(errorMessage),
            _logger.Object
        );

        await middleware.InvokeAsync(context);

        Assert.Equal((int)HttpStatusCode.TooManyRequests, context.Response.StatusCode);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var json = JsonSerializer.Deserialize<JsonElement>(body);

        Assert.Equal("too_many_attempts", json.GetProperty("error").GetString());
    }
}
