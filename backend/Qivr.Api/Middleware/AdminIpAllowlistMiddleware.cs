using System.Net;
using Microsoft.Extensions.Options;

namespace Qivr.Api.Middleware;

/// <summary>
/// Configuration for admin API IP allowlisting
/// </summary>
public class AdminIpAllowlistOptions
{
    public const string SectionName = "AdminSecurity";

    /// <summary>
    /// Enable IP allowlisting for admin routes
    /// </summary>
    public bool EnableIpAllowlist { get; set; } = false;

    /// <summary>
    /// List of allowed IP addresses or CIDR ranges
    /// Examples: "10.0.0.1", "192.168.1.0/24", "2001:db8::/32"
    /// </summary>
    public List<string> AllowedIps { get; set; } = new();

    /// <summary>
    /// Path prefixes that require IP allowlisting
    /// </summary>
    public List<string> ProtectedPaths { get; set; } = new()
    {
        "/api/admin"
    };

    /// <summary>
    /// Always allow localhost for development
    /// </summary>
    public bool AllowLocalhost { get; set; } = true;

    /// <summary>
    /// Custom message to show when access is denied
    /// </summary>
    public string DeniedMessage { get; set; } = "Access denied. Your IP is not authorized for admin access.";
}

/// <summary>
/// Middleware that restricts admin API access to specific IP addresses.
/// This adds an additional layer of security for sensitive operations.
/// </summary>
public class AdminIpAllowlistMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<AdminIpAllowlistMiddleware> _logger;
    private readonly AdminIpAllowlistOptions _options;
    private readonly List<(IPAddress Address, int PrefixLength)> _allowedRanges;

    public AdminIpAllowlistMiddleware(
        RequestDelegate next,
        ILogger<AdminIpAllowlistMiddleware> logger,
        IOptions<AdminIpAllowlistOptions> options)
    {
        _next = next;
        _logger = logger;
        _options = options.Value;
        _allowedRanges = ParseAllowedIps(_options.AllowedIps);
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Skip if IP allowlisting is disabled
        if (!_options.EnableIpAllowlist)
        {
            await _next(context);
            return;
        }

        // Check if this is a protected path
        var path = context.Request.Path.Value ?? "";
        var isProtectedPath = _options.ProtectedPaths.Any(p =>
            path.StartsWith(p, StringComparison.OrdinalIgnoreCase));

        if (!isProtectedPath)
        {
            await _next(context);
            return;
        }

        // Get client IP
        var clientIp = GetClientIpAddress(context);
        if (clientIp == null)
        {
            _logger.LogWarning("Admin access denied: Could not determine client IP for path {Path}", path);
            await DenyAccess(context, "Could not determine client IP address");
            return;
        }

        // Check if IP is allowed
        if (!IsIpAllowed(clientIp))
        {
            _logger.LogWarning(
                "Admin access denied: IP {ClientIp} not in allowlist for path {Path}",
                clientIp, path);

            await DenyAccess(context, _options.DeniedMessage);
            return;
        }

        _logger.LogDebug("Admin access allowed for IP {ClientIp} to path {Path}", clientIp, path);
        await _next(context);
    }

    private bool IsIpAllowed(IPAddress clientIp)
    {
        // Always allow localhost in development if configured
        if (_options.AllowLocalhost && IsLocalhost(clientIp))
        {
            return true;
        }

        // Check against allowed ranges
        foreach (var (address, prefixLength) in _allowedRanges)
        {
            if (IsInRange(clientIp, address, prefixLength))
            {
                return true;
            }
        }

        return false;
    }

    private static bool IsLocalhost(IPAddress ip)
    {
        return IPAddress.IsLoopback(ip) ||
               ip.Equals(IPAddress.IPv6Loopback) ||
               ip.ToString() == "::1" ||
               ip.ToString() == "127.0.0.1";
    }

    private static bool IsInRange(IPAddress clientIp, IPAddress networkAddress, int prefixLength)
    {
        // Exact match
        if (prefixLength == -1)
        {
            return clientIp.Equals(networkAddress);
        }

        // CIDR range check
        var clientBytes = clientIp.GetAddressBytes();
        var networkBytes = networkAddress.GetAddressBytes();

        if (clientBytes.Length != networkBytes.Length)
        {
            // IPv4 vs IPv6 mismatch
            // Try to map IPv4 to IPv6 or vice versa
            if (clientIp.IsIPv4MappedToIPv6)
            {
                clientIp = clientIp.MapToIPv4();
                clientBytes = clientIp.GetAddressBytes();
            }
            if (networkAddress.IsIPv4MappedToIPv6)
            {
                networkAddress = networkAddress.MapToIPv4();
                networkBytes = networkAddress.GetAddressBytes();
            }

            if (clientBytes.Length != networkBytes.Length)
                return false;
        }

        var fullBytes = prefixLength / 8;
        var remainingBits = prefixLength % 8;

        // Check full bytes
        for (int i = 0; i < fullBytes; i++)
        {
            if (clientBytes[i] != networkBytes[i])
                return false;
        }

        // Check remaining bits
        if (remainingBits > 0 && fullBytes < clientBytes.Length)
        {
            var mask = (byte)(0xFF << (8 - remainingBits));
            if ((clientBytes[fullBytes] & mask) != (networkBytes[fullBytes] & mask))
                return false;
        }

        return true;
    }

    private static List<(IPAddress, int)> ParseAllowedIps(List<string> allowedIps)
    {
        var result = new List<(IPAddress, int)>();

        foreach (var entry in allowedIps)
        {
            var trimmed = entry.Trim();
            if (string.IsNullOrEmpty(trimmed)) continue;

            try
            {
                if (trimmed.Contains('/'))
                {
                    // CIDR notation
                    var parts = trimmed.Split('/');
                    if (IPAddress.TryParse(parts[0], out var address) &&
                        int.TryParse(parts[1], out var prefix))
                    {
                        result.Add((address, prefix));
                    }
                }
                else
                {
                    // Single IP
                    if (IPAddress.TryParse(trimmed, out var address))
                    {
                        result.Add((address, -1)); // -1 means exact match
                    }
                }
            }
            catch
            {
                // Skip invalid entries
            }
        }

        return result;
    }

    private static IPAddress? GetClientIpAddress(HttpContext context)
    {
        // Check X-Forwarded-For header (for load balancers/proxies)
        var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            var firstIp = forwardedFor.Split(',')[0].Trim();
            if (IPAddress.TryParse(firstIp, out var forwardedIp))
            {
                return forwardedIp;
            }
        }

        // Check X-Real-IP header
        var realIp = context.Request.Headers["X-Real-IP"].FirstOrDefault();
        if (!string.IsNullOrEmpty(realIp) && IPAddress.TryParse(realIp, out var realAddress))
        {
            return realAddress;
        }

        // Fall back to connection remote IP
        return context.Connection.RemoteIpAddress;
    }

    private static async Task DenyAccess(HttpContext context, string message)
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new
        {
            error = "Forbidden",
            message,
            timestamp = DateTime.UtcNow
        });
    }
}

/// <summary>
/// Extension methods for registering the IP allowlist middleware
/// </summary>
public static class AdminIpAllowlistExtensions
{
    public static IServiceCollection AddAdminIpAllowlist(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<AdminIpAllowlistOptions>(
            configuration.GetSection(AdminIpAllowlistOptions.SectionName));
        return services;
    }

    public static IApplicationBuilder UseAdminIpAllowlist(this IApplicationBuilder app)
    {
        return app.UseMiddleware<AdminIpAllowlistMiddleware>();
    }
}
