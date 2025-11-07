using System.Security.Cryptography;
using Microsoft.AspNetCore.Antiforgery;

namespace Qivr.Api.Middleware;

/// <summary>
/// Middleware for CSRF (Cross-Site Request Forgery) protection
/// </summary>
public class CsrfProtectionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IAntiforgery _antiforgery;
    private readonly ILogger<CsrfProtectionMiddleware> _logger;
    
    // Safe methods that don't need CSRF protection
    private static readonly HashSet<string> SafeMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        "GET", "HEAD", "OPTIONS", "TRACE"
    };
    
    // Paths that don't need CSRF protection (webhooks, public endpoints)
    private static readonly HashSet<string> ExemptPaths = new(StringComparer.OrdinalIgnoreCase)
    {
        "/api/webhooks",
        "/api/health",
        "/api/migration",
        "/api/auth/login", // Login needs to work without existing CSRF token
        "/api/auth/signup",
        "/api/auth/refresh-token" // Refresh uses cookie auth
    };

    public CsrfProtectionMiddleware(
        RequestDelegate next,
        IAntiforgery antiforgery,
        ILogger<CsrfProtectionMiddleware> logger)
    {
        _next = next;
        _antiforgery = antiforgery;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Skip CSRF check for safe methods
        if (SafeMethods.Contains(context.Request.Method))
        {
            // For GET requests, generate and send CSRF token
            await GenerateAndSetCsrfToken(context);
            await _next(context);
            return;
        }

        // Skip CSRF check for exempt paths
        if (IsExemptPath(context.Request.Path))
        {
            await _next(context);
            return;
        }

        // Skip CSRF check for API requests with valid JWT Bearer token
        // (API clients use Bearer tokens, not cookies)
        if (HasValidBearerToken(context))
        {
            await _next(context);
            return;
        }

        // For state-changing requests with cookie auth, validate CSRF token
        try
        {
            await _antiforgery.ValidateRequestAsync(context);
            _logger.LogDebug("CSRF token validated successfully for {Method} {Path}", 
                context.Request.Method, context.Request.Path);
        }
        catch (AntiforgeryValidationException ex)
        {
            _logger.LogWarning(ex, "CSRF validation failed for {Method} {Path} from {IP}", 
                context.Request.Method, context.Request.Path, context.Connection.RemoteIpAddress);
            
            context.Response.StatusCode = 403;
            await context.Response.WriteAsJsonAsync(new
            {
                error = "CSRF validation failed",
                message = "Missing or invalid CSRF token"
            });
            return;
        }

        // Generate new token for response
        await GenerateAndSetCsrfToken(context);
        await _next(context);
    }

    private Task GenerateAndSetCsrfToken(HttpContext context)
    {
        var tokens = _antiforgery.GetAndStoreTokens(context);
        
        // Set CSRF token as a cookie (for double-submit cookie pattern)
        context.Response.Cookies.Append("XSRF-TOKEN", tokens.RequestToken!, new CookieOptions
        {
            HttpOnly = false, // JavaScript needs to read this to send in header
            Secure = !context.Request.Host.Host.Contains("localhost"),
            SameSite = SameSiteMode.Strict,
            Path = "/"
        });
        
        // Also send in response header for SPA frameworks
        context.Response.Headers["X-CSRF-Token"] = tokens.RequestToken!;
        
        return Task.CompletedTask;
    }

    private bool IsExemptPath(PathString path)
    {
        var pathValue = path.Value?.ToLowerInvariant() ?? string.Empty;
        return ExemptPaths.Any(exempt => pathValue.StartsWith(exempt));
    }

    private bool HasValidBearerToken(HttpContext context)
    {
        var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
        return !string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase);
    }
}

/// <summary>
/// Extension methods for CSRF protection
/// </summary>
public static class CsrfProtectionExtensions
{
    public static IServiceCollection AddCsrfProtection(this IServiceCollection services)
    {
        // Configure antiforgery service
        services.AddAntiforgery(options =>
        {
            options.HeaderName = "X-XSRF-TOKEN"; // Header name for CSRF token
            options.Cookie.Name = "__Host-X-CSRF-TOKEN"; // Secure cookie name
            options.Cookie.HttpOnly = true;
            options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
            options.Cookie.SameSite = SameSiteMode.Strict;
            options.SuppressXFrameOptionsHeader = false; // Keep X-Frame-Options for additional protection
        });
        
        return services;
    }
    
    public static IApplicationBuilder UseCsrfProtection(this IApplicationBuilder app)
    {
        return app.UseMiddleware<CsrfProtectionMiddleware>();
    }
}
