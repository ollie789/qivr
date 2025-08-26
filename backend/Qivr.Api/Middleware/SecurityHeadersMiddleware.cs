using System.Security.Cryptography;
using System.Text;

namespace Qivr.Api.Middleware;

/// <summary>
/// Middleware to add security headers including CSP, X-Frame-Options, and other security headers.
/// Critical for preventing XSS, clickjacking, and other attacks.
/// </summary>
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<SecurityHeadersMiddleware> _logger;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;

    public SecurityHeadersMiddleware(
        RequestDelegate next,
        ILogger<SecurityHeadersMiddleware> logger,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _configuration = configuration;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Generate nonce for inline scripts (if needed)
        var nonce = GenerateNonce();
        context.Items["CSP-Nonce"] = nonce;

        // Determine if this is a widget request
        var isWidget = context.Request.Path.StartsWithSegments("/api/widget") ||
                      context.Request.Path.StartsWithSegments("/widget");
        
        // Determine if this is an API request
        var isApi = context.Request.Path.StartsWithSegments("/api");

        // Add security headers before processing the request
        AddSecurityHeaders(context.Response, nonce, isWidget, isApi);

        await _next(context);
    }

    private void AddSecurityHeaders(HttpResponse response, string nonce, bool isWidget, bool isApi)
    {
        // Remove server header
        response.Headers.Remove("Server");
        response.Headers.Remove("X-Powered-By");

        // Add strict transport security (HSTS) - enforce HTTPS
        if (!_environment.IsDevelopment())
        {
            response.Headers.Add("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
        }

        // Content Security Policy - Different policies for different contexts
        if (isWidget)
        {
            // Widget CSP - Allow embedding in clinic domains only
            var allowedClinicDomains = _configuration.GetSection("Security:AllowedClinicDomains")
                .Get<string[]>() ?? new[] { "*.clinic.local", "*.qivr.health" };
            
            var frameAncestors = string.Join(" ", allowedClinicDomains.Select(d => $"https://{d}"));
            
            var widgetCsp = new[]
            {
                "default-src 'self'",
                $"script-src 'self' 'nonce-{nonce}' 'wasm-unsafe-eval'", // wasm-unsafe-eval for Three.js
                "style-src 'self' 'unsafe-inline'", // MUI requires inline styles
                "img-src 'self' data: blob:", // blob for 3D textures
                "font-src 'self' data:",
                "connect-src 'self' https://api.qivr.health wss://api.qivr.health",
                $"frame-ancestors {frameAncestors}",
                "base-uri 'self'",
                "form-action 'self'",
                "worker-src 'self' blob:", // For Three.js workers
                "child-src 'none'",
                "object-src 'none'",
                "upgrade-insecure-requests"
            };
            
            response.Headers.Add("Content-Security-Policy", string.Join("; ", widgetCsp));
            
            // Allow embedding in clinic sites only
            response.Headers.Add("X-Frame-Options", "SAMEORIGIN");
        }
        else if (isApi)
        {
            // API CSP - Very restrictive
            var apiCsp = new[]
            {
                "default-src 'none'",
                "frame-ancestors 'none'",
                "base-uri 'none'",
                "form-action 'none'"
            };
            
            response.Headers.Add("Content-Security-Policy", string.Join("; ", apiCsp));
            response.Headers.Add("X-Frame-Options", "DENY");
        }
        else
        {
            // Portal/Dashboard CSP - No embedding allowed
            var portalCsp = new[]
            {
                "default-src 'self'",
                $"script-src 'self' 'nonce-{nonce}'",
                "style-src 'self' 'unsafe-inline'", // MUI requires this
                "img-src 'self' data: https:",
                "font-src 'self' data:",
                "connect-src 'self' https://api.qivr.health wss://api.qivr.health",
                "frame-ancestors 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "child-src 'none'",
                "object-src 'none'",
                "upgrade-insecure-requests"
            };
            
            response.Headers.Add("Content-Security-Policy", string.Join("; ", portalCsp));
            response.Headers.Add("X-Frame-Options", "DENY");
        }

        // Prevent MIME type sniffing
        response.Headers.Add("X-Content-Type-Options", "nosniff");

        // XSS Protection (legacy but still useful)
        response.Headers.Add("X-XSS-Protection", "1; mode=block");

        // Referrer Policy - Don't leak URLs with sensitive data
        response.Headers.Add("Referrer-Policy", "strict-origin-when-cross-origin");

        // Permissions Policy (formerly Feature Policy)
        var permissions = new[]
        {
            "accelerometer=()",
            "camera=()",
            "geolocation=()",
            "gyroscope=()",
            "magnetometer=()",
            "microphone=()",
            "payment=()",
            "usb=()"
        };
        response.Headers.Add("Permissions-Policy", string.Join(", ", permissions));

        // Cross-Origin headers for API
        if (isApi)
        {
            // These are handled by CORS middleware but we can add additional restrictions
            response.Headers.Add("Cross-Origin-Resource-Policy", "same-origin");
            response.Headers.Add("Cross-Origin-Embedder-Policy", "require-corp");
            response.Headers.Add("Cross-Origin-Opener-Policy", "same-origin");
        }

        // Cache control for sensitive data
        if (context.Request.Path.Value?.Contains("/api/") == true &&
            !context.Request.Path.Value.Contains("/api/public/"))
        {
            response.Headers.Add("Cache-Control", "no-store, no-cache, must-revalidate, private");
            response.Headers.Add("Pragma", "no-cache");
            response.Headers.Add("Expires", "0");
        }

        _logger.LogDebug("Security headers applied for path: {Path}, IsWidget: {IsWidget}, IsApi: {IsApi}", 
            context.Request.Path, isWidget, isApi);
    }

    private static string GenerateNonce()
    {
        var bytes = new byte[16];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes);
    }
}

/// <summary>
/// Extension methods for registering the security headers middleware
/// </summary>
public static class SecurityHeadersMiddlewareExtensions
{
    public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<SecurityHeadersMiddleware>();
    }
}

/// <summary>
/// Helper class for CSP nonce in Razor views (if needed)
/// </summary>
public class CspNonceService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CspNonceService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string? GetNonce()
    {
        return _httpContextAccessor.HttpContext?.Items["CSP-Nonce"]?.ToString();
    }
}
