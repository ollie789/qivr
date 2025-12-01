using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Infrastructure.Services;

/// <summary>
/// Service for logging all admin write operations.
/// All administrative actions that modify data should be logged here.
/// </summary>
public interface IAdminAuditService
{
    /// <summary>
    /// Log an admin action
    /// </summary>
    Task LogAsync(
        string action,
        string resourceType,
        Guid resourceId,
        string? resourceName = null,
        object? previousState = null,
        object? newState = null,
        bool success = true,
        string? errorMessage = null,
        Dictionary<string, object>? metadata = null,
        CancellationToken ct = default);

    /// <summary>
    /// Log an admin action (sync version for simple cases)
    /// </summary>
    void Log(
        string action,
        string resourceType,
        Guid resourceId,
        string? resourceName = null,
        object? previousState = null,
        object? newState = null,
        bool success = true,
        string? errorMessage = null,
        Dictionary<string, object>? metadata = null);
}

public class AdminAuditService : IAdminAuditService
{
    private readonly QivrDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<AdminAuditService> _logger;

    public AdminAuditService(
        QivrDbContext context,
        IHttpContextAccessor httpContextAccessor,
        ILogger<AdminAuditService> logger)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public async Task LogAsync(
        string action,
        string resourceType,
        Guid resourceId,
        string? resourceName = null,
        object? previousState = null,
        object? newState = null,
        bool success = true,
        string? errorMessage = null,
        Dictionary<string, object>? metadata = null,
        CancellationToken ct = default)
    {
        try
        {
            var httpContext = _httpContextAccessor.HttpContext;
            var user = httpContext?.User;

            var auditLog = new AdminAuditLog
            {
                AdminUserId = GetUserId(user),
                AdminEmail = GetUserEmail(user),
                Action = action,
                ResourceType = resourceType,
                ResourceId = resourceId,
                ResourceName = resourceName,
                PreviousState = previousState != null ? JsonSerializer.Serialize(previousState) : null,
                NewState = newState != null ? JsonSerializer.Serialize(newState) : null,
                IpAddress = GetClientIp(httpContext),
                UserAgent = httpContext?.Request.Headers["User-Agent"].FirstOrDefault(),
                CorrelationId = httpContext?.TraceIdentifier,
                Success = success,
                ErrorMessage = errorMessage,
                Metadata = metadata != null ? JsonSerializer.Serialize(metadata) : null
            };

            _context.Set<AdminAuditLog>().Add(auditLog);
            await _context.SaveChangesAsync(ct);

            // Also log to structured logging for immediate visibility
            if (success)
            {
                _logger.LogInformation(
                    "Admin audit: {Action} on {ResourceType} {ResourceId} by {AdminEmail} from {IpAddress}",
                    action, resourceType, resourceId, auditLog.AdminEmail, auditLog.IpAddress);
            }
            else
            {
                _logger.LogWarning(
                    "Admin audit FAILED: {Action} on {ResourceType} {ResourceId} by {AdminEmail} from {IpAddress}: {Error}",
                    action, resourceType, resourceId, auditLog.AdminEmail, auditLog.IpAddress, errorMessage);
            }
        }
        catch (Exception ex)
        {
            // Never let audit logging break the main operation
            _logger.LogError(ex, "Failed to write admin audit log for {Action} on {ResourceType} {ResourceId}",
                action, resourceType, resourceId);
        }
    }

    public void Log(
        string action,
        string resourceType,
        Guid resourceId,
        string? resourceName = null,
        object? previousState = null,
        object? newState = null,
        bool success = true,
        string? errorMessage = null,
        Dictionary<string, object>? metadata = null)
    {
        // Fire and forget, but log errors
        _ = Task.Run(async () =>
        {
            await LogAsync(action, resourceType, resourceId, resourceName,
                previousState, newState, success, errorMessage, metadata);
        });
    }

    private static string GetUserId(ClaimsPrincipal? user)
    {
        return user?.FindFirst("sub")?.Value
            ?? user?.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? "unknown";
    }

    private static string? GetUserEmail(ClaimsPrincipal? user)
    {
        return user?.FindFirst("email")?.Value
            ?? user?.FindFirst(ClaimTypes.Email)?.Value;
    }

    private static string? GetClientIp(HttpContext? context)
    {
        if (context == null) return null;

        // Check for forwarded header (load balancer/proxy)
        var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            // Take the first IP (client IP)
            return forwardedFor.Split(',')[0].Trim();
        }

        return context.Connection.RemoteIpAddress?.ToString();
    }
}
