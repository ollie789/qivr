using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Middleware;

public class TenantMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TenantMiddleware> _logger;
    private readonly IServiceScopeFactory _scopeFactory;

    public TenantMiddleware(RequestDelegate next, ILogger<TenantMiddleware> logger, IServiceScopeFactory scopeFactory)
    {
        _next = next;
        _logger = logger;
        _scopeFactory = scopeFactory;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Extract tenant from various sources
        string? tenantId = null;
        
        // 1. Try from JWT claim
        if (context.User.Identity?.IsAuthenticated == true)
        {
            tenantId = context.User.FindFirst("tenant_id")?.Value;
        }
        
        // 2. Try from header (for widget/API calls)
        if (string.IsNullOrEmpty(tenantId))
        {
            tenantId = context.Request.Headers["X-Tenant-Id"].FirstOrDefault();
        }
        
        // 3. Try from subdomain
        if (string.IsNullOrEmpty(tenantId))
        {
            var host = context.Request.Host.Host;
            if (!string.IsNullOrEmpty(host) && !host.StartsWith("localhost"))
            {
                var subdomain = host.Split('.').FirstOrDefault();
                if (!string.IsNullOrEmpty(subdomain) && subdomain != "www")
                {
                    // Here you would look up the tenant by subdomain
                    // For now, we'll just log it
                    _logger.LogDebug("Subdomain detected: {Subdomain}", subdomain);
                }
            }
        }
        
        // Add tenant to HttpContext items for downstream use
        if (!string.IsNullOrEmpty(tenantId))
        {
            context.Items["TenantId"] = tenantId;
            
            // Set RLS context in database for this request
            await SetDatabaseTenantContext(tenantId);
            
            _logger.LogDebug("Tenant context set: {TenantId} (RLS enabled)", tenantId);
        }
        else if (RequiresTenant(context.Request.Path))
        {
            // For protected endpoints, tenant is required
            _logger.LogWarning("Request to protected endpoint without tenant context: {Path}", context.Request.Path);
            context.Response.StatusCode = 401;
            await context.Response.WriteAsync("{\"error\":\"Tenant context required\"}");
            return;
        }
        
        await _next(context);
    }
    
    private async Task SetDatabaseTenantContext(string tenantId)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<QivrDbContext>();
        
        try
        {
            var connection = dbContext.Database.GetDbConnection();
            
            if (connection.State != System.Data.ConnectionState.Open)
            {
                await connection.OpenAsync();
            }

            using var command = connection.CreateCommand();
            command.CommandText = "SELECT set_tenant_context(@tenant_id::uuid)";
            
            var parameter = command.CreateParameter();
            parameter.ParameterName = "@tenant_id";
            parameter.Value = Guid.Parse(tenantId);
            command.Parameters.Add(parameter);
            
            await command.ExecuteNonQueryAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to set RLS tenant context for {TenantId}", tenantId);
            throw;
        }
    }
    
    private bool RequiresTenant(PathString path)
    {
        // Public endpoints that don't require tenant context
        var publicPaths = new[]
        {
            "/health",
            "/swagger",
            "/api/auth/login",
            "/api/auth/signup",
            "/api/auth/forgot-password",
            "/api/auth/refresh",
            "/webhooks",
            "/api/v1/intake"  // Public intake submission endpoint
        };
        
        return !publicPaths.Any(p => path.StartsWithSegments(p));
    }
}

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;
    private readonly IHostEnvironment _environment;

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger, IHostEnvironment environment)
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
            _logger.LogError(ex, "An unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        
        var response = new ErrorResponse();
        
        switch (exception)
        {
            case UnauthorizedAccessException:
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                response.Message = "Unauthorized access";
                response.Code = "UNAUTHORIZED";
                break;
                
            case KeyNotFoundException:
                context.Response.StatusCode = StatusCodes.Status404NotFound;
                response.Message = "Resource not found";
                response.Code = "NOT_FOUND";
                break;
                
            case ArgumentException:
            case InvalidOperationException:
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                response.Message = exception.Message;
                response.Code = "BAD_REQUEST";
                break;
                
            default:
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                response.Message = "An error occurred while processing your request";
                response.Code = "INTERNAL_ERROR";
                
                if (_environment.IsDevelopment())
                {
                    response.Details = exception.ToString();
                }
                break;
        }
        
        response.TraceId = context.TraceIdentifier;
        response.Timestamp = DateTime.UtcNow;
        
        await context.Response.WriteAsJsonAsync(response);
    }
}

public class ErrorResponse
{
    public string Message { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Details { get; set; }
    public string TraceId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}
