using System.Security.Claims;
using Microsoft.AspNetCore.Http;
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
        // Allow CORS preflight requests to pass through without tenant validation
        if (HttpMethods.IsOptions(context.Request.Method))
        {
            await _next(context);
            return;
        }

        // Extract tenant from various sources
        string? tenantId = null;
        string? userTenantId = null;
        Guid? tenantGuid = null;
        
        // 1. Try from JWT claim (most authoritative)
        if (context.User.Identity?.IsAuthenticated == true)
        {
            userTenantId = context.User.FindFirst("tenant_id")?.Value 
                        ?? context.User.FindFirst("custom:tenant_id")?.Value;
            tenantId = userTenantId;
        }
        
        // 2. Try from header (for widget/API calls)
        var headerTenantId = context.Request.Headers["X-Tenant-Id"].FirstOrDefault();
        if (!string.IsNullOrEmpty(headerTenantId))
        {
            // CRITICAL SECURITY CHECK: Validate header tenant matches user's tenant
            if (!string.IsNullOrEmpty(userTenantId) && headerTenantId != userTenantId)
            {
                _logger.LogWarning(
                    "SECURITY: Tenant mismatch detected! User tenant: {UserTenant}, Header tenant: {HeaderTenant}, Path: {Path}, IP: {IP}",
                    userTenantId, headerTenantId, context.Request.Path, context.Connection.RemoteIpAddress);
                
                context.Response.StatusCode = 403;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync("{\"error\":\"Forbidden: Tenant access violation\"}");
                return;
            }
            
            // Only use header tenant if user is not authenticated or it matches
            if (string.IsNullOrEmpty(tenantId))
            {
                tenantId = headerTenantId;
            }
        }
        
        // 3. Try from subdomain (lowest priority)
        if (string.IsNullOrEmpty(tenantId))
        {
            var host = context.Request.Host.Host;
            if (!string.IsNullOrEmpty(host) && !host.StartsWith("localhost"))
            {
                var subdomain = host.Split('.').FirstOrDefault();
                if (!string.IsNullOrEmpty(subdomain) && subdomain != "www")
                {
                    // TODO: Implement subdomain to tenant lookup
                    // var tenant = await _tenantService.GetBySubdomainAsync(subdomain);
                    // if (tenant != null) tenantId = tenant.Id.ToString();
                    _logger.LogDebug("Subdomain detected: {Subdomain}", subdomain);
                }
            }
        }
        
        // Validate tenant ID format
        if (!string.IsNullOrEmpty(tenantId))
        {
            if (!Guid.TryParse(tenantId, out var parsedTenantGuid))
            {
                _logger.LogWarning("Invalid tenant ID format: {TenantId}", tenantId);
                context.Response.StatusCode = 400;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync("{\"error\":\"Invalid tenant ID format\"}");
                return;
            }

            tenantGuid = parsedTenantGuid;
            context.Items["TenantId"] = parsedTenantGuid; // Store as Guid, not string
            context.Items["ValidatedTenant"] = true;

            // Set RLS context in database for this request
            await SetDatabaseTenantContext(parsedTenantGuid);

            _logger.LogDebug("Tenant context set: {TenantId} (RLS enabled)", tenantGuid);
        }
        else if (RequiresTenant(context.Request.Path))
        {
            // For protected endpoints, tenant is required
            _logger.LogWarning("Request to protected endpoint without tenant context: {Path}", context.Request.Path);
            context.Response.StatusCode = 401;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync("{\"error\":\"Tenant context required\"}");
            return;
        }
        
        await _next(context);
    }
    
    private async Task SetDatabaseTenantContext(Guid tenantId)
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

            // Prefer built-in session GUC to avoid dependency on custom SQL function
            using var command = connection.CreateCommand();
            command.CommandText = "SELECT set_config('app.tenant_id', @tenant_id::text, true)";

            var parameter = command.CreateParameter();
            parameter.ParameterName = "@tenant_id";
            parameter.Value = tenantId.ToString();
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
            "/api/auth/register",
            "/api/auth/login",
            "/api/auth/signup",
            "/api/auth/forgot-password",
            "/api/auth/refresh",
            "/api/auth/refresh-token",
            "/api/tenants",
            "/api/admin",  // Admin portal endpoints (use separate auth)
            "/api/migration",
            "/api/debug",  // Debug endpoints for testing
            "/webhooks",
            "/api/v1/intake",  // Public intake submission endpoint
            "/api/v1/proms/instances" // Base path for public PROM instances endpoints
        };
        
        // Allow all subpaths under the public endpoints
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
