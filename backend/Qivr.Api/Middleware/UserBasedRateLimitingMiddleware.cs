using System.Security.Claims;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Qivr.Api.Services;

namespace Qivr.Api.Middleware;

public static class UserBasedRateLimitingExtensions
{
    public static IServiceCollection AddUserBasedRateLimiting(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            
            // Authentication endpoints - strict per-IP limiting
            options.AddPolicy("auth", httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: GetClientIdentifier(httpContext, useIp: true),
                    factory: partition => new FixedWindowRateLimiterOptions
                    {
                        AutoReplenishment = true,
                        PermitLimit = 5,
                        Window = TimeSpan.FromMinutes(1),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0
                    }));
            
            // Password reset - very strict per-IP
            options.AddPolicy("password-reset", httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: GetClientIdentifier(httpContext, useIp: true),
                    factory: partition => new FixedWindowRateLimiterOptions
                    {
                        AutoReplenishment = true,
                        PermitLimit = 3,
                        Window = TimeSpan.FromMinutes(5),
                        QueueLimit = 0
                    }));
            
            // API calls - per-user rate limiting for authenticated users, per-IP for anonymous
            options.AddPolicy("api", httpContext =>
            {
                var identifier = GetClientIdentifier(httpContext);
                var isAuthenticated = httpContext.User?.Identity?.IsAuthenticated ?? false;
                
                return RateLimitPartition.GetSlidingWindowLimiter(
                    partitionKey: identifier,
                    factory: partition => new SlidingWindowRateLimiterOptions
                    {
                        AutoReplenishment = true,
                        PermitLimit = isAuthenticated ? 200 : 50, // Higher limits for authenticated users
                        Window = TimeSpan.FromMinutes(1),
                        SegmentsPerWindow = 4,
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = isAuthenticated ? 20 : 5
                    });
            });
            
            // Heavy operations - per-user strict limiting
            options.AddPolicy("heavy-operation", httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: GetClientIdentifier(httpContext),
                    factory: partition => new FixedWindowRateLimiterOptions
                    {
                        AutoReplenishment = true,
                        PermitLimit = 10,
                        Window = TimeSpan.FromMinutes(5),
                        QueueLimit = 2
                    }));
            
            // Intake form submissions - moderate per-IP limiting
            options.AddPolicy("intake", httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: GetClientIdentifier(httpContext, useIp: true),
                    factory: partition => new FixedWindowRateLimiterOptions
                    {
                        AutoReplenishment = true,
                        PermitLimit = 30,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 5
                    }));
            
            // Search operations - per-user token bucket for burst allowance
            options.AddPolicy("search", httpContext =>
                RateLimitPartition.GetTokenBucketLimiter(
                    partitionKey: GetClientIdentifier(httpContext),
                    factory: partition => new TokenBucketRateLimiterOptions
                    {
                        AutoReplenishment = true,
                        TokenLimit = 20,
                        TokensPerPeriod = 10,
                        ReplenishmentPeriod = TimeSpan.FromSeconds(30),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 5
                    }));
            
            // File uploads - strict per-user limiting
            options.AddPolicy("file-upload", httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: GetClientIdentifier(httpContext),
                    factory: partition => new FixedWindowRateLimiterOptions
                    {
                        AutoReplenishment = true,
                        PermitLimit = 10,
                        Window = TimeSpan.FromMinutes(10),
                        QueueLimit = 0
                    }));
            
            // Webhook endpoints - per-source IP with higher limits
            options.AddPolicy("webhook", httpContext =>
                RateLimitPartition.GetSlidingWindowLimiter(
                    partitionKey: GetClientIdentifier(httpContext, useIp: true),
                    factory: partition => new SlidingWindowRateLimiterOptions
                    {
                        AutoReplenishment = true,
                        PermitLimit = 500,
                        Window = TimeSpan.FromMinutes(1),
                        SegmentsPerWindow = 4,
                        QueueLimit = 50
                    }));
            
            // Admin operations - relaxed per-user limiting
            options.AddPolicy("admin", httpContext =>
            {
                var userId = httpContext.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "anonymous";
                return RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: $"admin:{userId}",
                    factory: partition => new FixedWindowRateLimiterOptions
                    {
                        AutoReplenishment = true,
                        PermitLimit = 100,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 10
                    });
            });
            
            // Global limiter with concurrency limiting
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
            {
                var identifier = GetClientIdentifier(httpContext, useIp: true);
                
                return RateLimitPartition.GetConcurrencyLimiter(
                    partitionKey: identifier,
                    factory: partition => new ConcurrencyLimiterOptions
                    {
                        PermitLimit = 10, // Max 10 concurrent requests per client
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 20
                    });
            });
            
            // Custom rejection response
            options.OnRejected = async (context, cancellationToken) =>
            {
                context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                context.HttpContext.Response.ContentType = "application/json";
                
                var retryAfter = TimeSpan.FromSeconds(60);
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfterValue))
                {
                    retryAfter = retryAfterValue;
                }
                
                context.HttpContext.Response.Headers["Retry-After"] = retryAfter.TotalSeconds.ToString();
                context.HttpContext.Response.Headers["X-RateLimit-Limit"] = "See documentation";
                
                var response = new
                {
                    type = "https://tools.ietf.org/html/rfc6585#section-4",
                    title = "Too Many Requests",
                    status = 429,
                    detail = "Rate limit exceeded. Please retry after the specified time.",
                    instance = context.HttpContext.Request.Path,
                    retryAfterSeconds = (int)retryAfter.TotalSeconds
                };
                
                await context.HttpContext.Response.WriteAsJsonAsync(response, cancellationToken);
            };
        });
        
        return services;
    }
    
    private static string GetClientIdentifier(HttpContext context, bool useIp = false)
    {
        if (!useIp && context.User?.Identity?.IsAuthenticated == true)
        {
            // For authenticated users, use their user ID
            var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                ?? context.User.FindFirst("sub")?.Value
                ?? context.User.FindFirst("user_id")?.Value;
                
            if (!string.IsNullOrEmpty(userId))
            {
                var tenantId = context.User.FindFirst("tenant_id")?.Value ?? "default";
                return $"user:{tenantId}:{userId}";
            }
        }
        
        // Fallback to IP address
        var ipAddress = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        
        // Check for X-Forwarded-For header if behind a proxy
        if (context.Request.Headers.ContainsKey("X-Forwarded-For"))
        {
            var forwardedFor = context.Request.Headers["X-Forwarded-For"].ToString();
            var ips = forwardedFor.Split(',', StringSplitOptions.RemoveEmptyEntries);
            if (ips.Length > 0)
            {
                ipAddress = ips[0].Trim();
            }
        }
        
        return $"ip:{ipAddress}";
    }
}

// Helper attribute to easily apply rate limiting policies to controllers/actions
// Note: This is just a wrapper for easier usage
public class RateLimitAttribute : Attribute
{
    public string PolicyName { get; }
    
    public RateLimitAttribute(string policyName)
    {
        PolicyName = policyName;
    }
}

// Extension for monitoring rate limit metrics
public interface IRateLimitMetricsService
{
    Task RecordRateLimitHit(string clientId, string policy, bool allowed);
    Task<RateLimitStats> GetStats(string clientId, TimeSpan window);
}

public class RateLimitMetricsService : IRateLimitMetricsService
{
    private readonly ICacheService _cacheService;
    private readonly ILogger<RateLimitMetricsService> _logger;
    
    public RateLimitMetricsService(ICacheService cacheService, ILogger<RateLimitMetricsService> logger)
    {
        _cacheService = cacheService;
        _logger = logger;
    }
    
    public async Task RecordRateLimitHit(string clientId, string policy, bool allowed)
    {
        var key = $"ratelimit:metrics:{clientId}:{policy}:{DateTime.UtcNow:yyyyMMddHH}";
        var metrics = await _cacheService.GetAsync<RateLimitMetrics>(key) ?? new RateLimitMetrics();
        
        if (allowed)
            metrics.AllowedCount++;
        else
            metrics.RejectedCount++;
            
        metrics.LastHit = DateTime.UtcNow;
        
        await _cacheService.SetAsync(key, metrics, TimeSpan.FromHours(2));
        
        if (!allowed)
        {
            _logger.LogWarning("Rate limit exceeded for client {ClientId} on policy {Policy}", clientId, policy);
        }
    }
    
    public async Task<RateLimitStats> GetStats(string clientId, TimeSpan window)
    {
        var stats = new RateLimitStats { ClientId = clientId };
        var now = DateTime.UtcNow;
        var hours = (int)Math.Ceiling(window.TotalHours);
        
        for (int i = 0; i < hours; i++)
        {
            var hour = now.AddHours(-i);
            var pattern = $"ratelimit:metrics:{clientId}:*:{hour:yyyyMMddHH}";
            
            // Note: This would need Redis SCAN in production
            // Simplified for demonstration
        }
        
        return stats;
    }
}

public class RateLimitMetrics
{
    public int AllowedCount { get; set; }
    public int RejectedCount { get; set; }
    public DateTime LastHit { get; set; }
}

public class RateLimitStats
{
    public string ClientId { get; set; } = string.Empty;
    public int TotalAllowed { get; set; }
    public int TotalRejected { get; set; }
    public Dictionary<string, int> RejectedByPolicy { get; set; } = new();
    public DateTime? FirstHit { get; set; }
    public DateTime? LastHit { get; set; }
}