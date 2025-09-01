using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Middleware
{
    /// <summary>
    /// Middleware to set tenant context for Row-Level Security (RLS).
    /// This is CRITICAL for preventing cross-tenant data exposure.
    /// </summary>
    public class TenantContextMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<TenantContextMiddleware> _logger;

        public TenantContextMiddleware(
            RequestDelegate next,
            ILogger<TenantContextMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, QivrDbContext dbContext)
        {
            // Skip for health checks and public endpoints
            if (IsPublicEndpoint(context.Request.Path))
            {
                await _next(context);
                return;
            }

            // Extract tenant_id from JWT claims
            var tenantId = GetTenantIdFromClaims(context.User);
            
            if (string.IsNullOrEmpty(tenantId))
            {
                _logger.LogWarning("Request without tenant_id claim: {Path}", context.Request.Path);
                
                // For authenticated endpoints, tenant_id is required
                if (context.User.Identity?.IsAuthenticated == true && 
                    !IsSystemEndpoint(context.Request.Path))
                {
                    context.Response.StatusCode = 401;
                    await context.Response.WriteAsync("Missing tenant context");
                    return;
                }
                
                await _next(context);
                return;
            }

            // Set tenant context for this request
            try
            {
                await SetTenantContext(dbContext, tenantId);
                
                // Log for audit purposes
                _logger.LogDebug("Tenant context set: {TenantId} for {Path}", 
                    tenantId, context.Request.Path);
                
                // Add tenant_id to response headers for debugging (only in development)
                if (context.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment())
                {
                    context.Response.Headers["X-Tenant-Id"] = tenantId;
                }
                
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to set tenant context for {TenantId}", tenantId);
                context.Response.StatusCode = 500;
                await context.Response.WriteAsync("Internal server error");
            }
        }

        private async Task SetTenantContext(QivrDbContext dbContext, string tenantId)
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
            parameter.Value = tenantId;
            command.Parameters.Add(parameter);
            
            await command.ExecuteNonQueryAsync();
        }

        private string? GetTenantIdFromClaims(ClaimsPrincipal user)
        {
            // Try multiple claim types for flexibility
            return user.FindFirst("tenant_id")?.Value ??
                   user.FindFirst("custom:tenant_id")?.Value ??
                   user.FindFirst(ClaimTypes.GroupSid)?.Value;
        }

        private bool IsPublicEndpoint(PathString path)
        {
            var publicPaths = new[]
            {
                "/health",
                "/swagger",
                "/api/auth/login",
                "/api/auth/signup",
                "/api/auth/forgot-password",
                "/api/widget/embed.js",
                "/webhooks"
            };
            
            return publicPaths.Any(p => path.StartsWithSegments(p));
        }

        private bool IsSystemEndpoint(PathString path)
        {
            var systemPaths = new[]
            {
                "/api/system",
                "/api/admin/super",
                "/metrics"
            };
            
            return systemPaths.Any(p => path.StartsWithSegments(p));
        }
    }

    /// <summary>
    /// Extension method to register the middleware
    /// </summary>
    public static class TenantContextMiddlewareExtensions
    {
        public static IApplicationBuilder UseTenantContext(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<TenantContextMiddleware>();
        }
    }
}
