namespace Qivr.Api.Exceptions;

/// <summary>
/// Base exception class for all API exceptions
/// </summary>
public abstract class ApiException : Exception
{
    public int StatusCode { get; }
    public string ErrorCode { get; }
    public object? Details { get; }

    protected ApiException(string message, int statusCode, string errorCode, object? details = null) 
        : base(message)
    {
        StatusCode = statusCode;
        ErrorCode = errorCode;
        Details = details;
    }
}

/// <summary>
/// Exception thrown when a requested resource is not found
/// </summary>
public class NotFoundException : ApiException
{
    public NotFoundException(string message, string? errorCode = null) 
        : base(message, 404, errorCode ?? "NOT_FOUND")
    {
    }

    public NotFoundException(string entityName, Guid id) 
        : base($"{entityName} with id {id} was not found", 404, "NOT_FOUND")
    {
    }
}

/// <summary>
/// Exception thrown when a request contains invalid data
/// </summary>
public class ValidationException : ApiException
{
    public ValidationException(string message, object? validationErrors = null) 
        : base(message, 400, "VALIDATION_ERROR", validationErrors)
    {
    }

    public ValidationException(IDictionary<string, string[]> validationErrors) 
        : base("One or more validation errors occurred", 400, "VALIDATION_ERROR", validationErrors)
    {
    }
}

/// <summary>
/// Exception thrown when a user is not authorized to perform an action
/// </summary>
public class UnauthorizedException : ApiException
{
    public UnauthorizedException(string message = "Unauthorized") 
        : base(message, 401, "UNAUTHORIZED")
    {
    }
}

/// <summary>
/// Exception thrown when a user doesn't have permission to access a resource
/// </summary>
public class ForbiddenException : ApiException
{
    public ForbiddenException(string message = "Access denied") 
        : base(message, 403, "FORBIDDEN")
    {
    }

    public ForbiddenException(string resource, string action) 
        : base($"You don't have permission to {action} {resource}", 403, "FORBIDDEN")
    {
    }
}

/// <summary>
/// Exception thrown when there's a conflict with the current state
/// </summary>
public class ConflictException : ApiException
{
    public ConflictException(string message) 
        : base(message, 409, "CONFLICT")
    {
    }

    public ConflictException(string entityName, string field, string value) 
        : base($"{entityName} with {field} '{value}' already exists", 409, "CONFLICT")
    {
    }
}

/// <summary>
/// Exception thrown when a business rule is violated
/// </summary>
public class BusinessRuleException : ApiException
{
    public BusinessRuleException(string message, string? errorCode = null) 
        : base(message, 422, errorCode ?? "BUSINESS_RULE_VIOLATION")
    {
    }
}

/// <summary>
/// Exception thrown when an external service fails
/// </summary>
public class ExternalServiceException : ApiException
{
    public string ServiceName { get; }

    public ExternalServiceException(string serviceName, string message) 
        : base($"{serviceName} service error: {message}", 503, "EXTERNAL_SERVICE_ERROR")
    {
        ServiceName = serviceName;
    }
}

/// <summary>
/// Exception thrown when rate limit is exceeded
/// </summary>
public class RateLimitException : ApiException
{
    public int RetryAfterSeconds { get; }

    public RateLimitException(int retryAfterSeconds = 60) 
        : base("Rate limit exceeded. Please try again later.", 429, "RATE_LIMIT_EXCEEDED")
    {
        RetryAfterSeconds = retryAfterSeconds;
    }
}