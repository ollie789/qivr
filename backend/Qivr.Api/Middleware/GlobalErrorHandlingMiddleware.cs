using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Qivr.Api.Exceptions;

namespace Qivr.Api.Middleware;

public class GlobalErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalErrorHandlingMiddleware> _logger;
    private readonly IWebHostEnvironment _environment;

    public GlobalErrorHandlingMiddleware(
        RequestDelegate next,
        ILogger<GlobalErrorHandlingMiddleware> logger,
        IWebHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

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
        // Log the exception
        LogException(exception);

        // Set response content type
        context.Response.ContentType = "application/problem+json";

        // Create problem details response
        ProblemDetails problemDetails;

        switch (exception)
        {
            case ApiException apiException:
                context.Response.StatusCode = apiException.StatusCode;
                problemDetails = new ProblemDetails
                {
                    Status = apiException.StatusCode,
                    Title = GetTitleForStatusCode(apiException.StatusCode),
                    Detail = apiException.Message,
                    Instance = context.Request.Path,
                    Type = $"https://httpstatuses.com/{apiException.StatusCode}"
                };

                // Add error code to extensions
                problemDetails.Extensions["errorCode"] = apiException.ErrorCode;

                // Add details if present
                if (apiException.Details != null)
                {
                    problemDetails.Extensions["errors"] = apiException.Details;
                }

                // Add retry-after header for rate limit exceptions
                if (apiException is RateLimitException rateLimitException)
                {
                    context.Response.Headers["Retry-After"] = rateLimitException.RetryAfterSeconds.ToString();
                }
                break;

            case OperationCanceledException:
                // Client disconnected, don't log as error
                context.Response.StatusCode = 499; // Client Closed Request
                problemDetails = new ProblemDetails
                {
                    Status = 499,
                    Title = "Request Cancelled",
                    Detail = "The request was cancelled by the client",
                    Instance = context.Request.Path
                };
                break;

            default:
                // Unhandled exception - return 500
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                problemDetails = new ProblemDetails
                {
                    Status = (int)HttpStatusCode.InternalServerError,
                    Title = "An error occurred while processing your request",
                    Instance = context.Request.Path,
                    Type = "https://httpstatuses.com/500"
                };

                // Add error details in development environment
                if (_environment.IsDevelopment())
                {
                    problemDetails.Detail = exception.Message;
                    problemDetails.Extensions["stackTrace"] = exception.StackTrace;
                    problemDetails.Extensions["exceptionType"] = exception.GetType().Name;
                    
                    if (exception.InnerException != null)
                    {
                        problemDetails.Extensions["innerException"] = new
                        {
                            message = exception.InnerException.Message,
                            type = exception.InnerException.GetType().Name,
                            stackTrace = exception.InnerException.StackTrace
                        };
                    }
                }
                else
                {
                    problemDetails.Detail = "An unexpected error occurred. Please try again later.";
                }

                // Add correlation ID for tracking
                problemDetails.Extensions["traceId"] = context.TraceIdentifier;
                break;
        }

        // Serialize and write response
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        };

        var json = JsonSerializer.Serialize(problemDetails, options);
        await context.Response.WriteAsync(json);
    }

    private void LogException(Exception exception)
    {
        switch (exception)
        {
            case ApiException apiException when apiException.StatusCode >= 400 && apiException.StatusCode < 500:
                // Client errors - log as warning
                _logger.LogWarning(exception, "Client error occurred: {ErrorCode}", apiException.ErrorCode);
                break;

            case ApiException apiException:
                // Server errors from API exceptions
                _logger.LogError(exception, "API error occurred: {ErrorCode}", apiException.ErrorCode);
                break;

            case OperationCanceledException:
                // Don't log cancelled operations
                break;

            default:
                // Unhandled exceptions - log as error
                _logger.LogError(exception, "Unhandled exception occurred");
                break;
        }
    }

    private static string GetTitleForStatusCode(int statusCode) => statusCode switch
    {
        400 => "Bad Request",
        401 => "Unauthorized",
        403 => "Forbidden",
        404 => "Not Found",
        409 => "Conflict",
        422 => "Unprocessable Entity",
        429 => "Too Many Requests",
        500 => "Internal Server Error",
        503 => "Service Unavailable",
        _ => "Error"
    };
}