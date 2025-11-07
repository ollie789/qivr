using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Qivr.Api.Exceptions;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Controllers;

/// <summary>
/// Base controller providing common functionality for all API controllers
/// </summary>
[ApiController]
[Authorize]
[Route("api/[controller]")]
public abstract class BaseApiController : ControllerBase
{
    /// <summary>
    /// Gets the current authenticated user ID
    /// </summary>
    protected Guid CurrentUserId
    {
        get
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value
                ?? User.FindFirst("username")?.Value
                ?? User.FindFirst("cognito:username")?.Value;

            if (!string.IsNullOrEmpty(userIdClaim))
            {
                // If it's a GUID, return it
                if (Guid.TryParse(userIdClaim, out var userId))
                    return userId;
                
                // Otherwise, create a deterministic GUID from the string
                // This ensures the same user always gets the same GUID
                using (var md5 = System.Security.Cryptography.MD5.Create())
                {
                    byte[] hash = md5.ComputeHash(System.Text.Encoding.UTF8.GetBytes(userIdClaim));
                    return new Guid(hash);
                }
            }

            throw new UnauthorizedException("User ID not found in token");
        }
    }

    /// <summary>
    /// Gets the current tenant ID from the HTTP context
    /// </summary>
    protected Guid? CurrentTenantId
    {
        get
        {
            // Try to get from claim first (custom claims from Cognito)
            var tenantClaim = User.FindFirst("tenant_id")?.Value 
                ?? User.FindFirst("custom:tenant_id")?.Value
                ?? User.FindFirst("custom:custom:tenant_id")?.Value;
                
            if (Guid.TryParse(tenantClaim, out var tenantId))
                return tenantId;
            
            // Try to get from header (frontend sends this)
            var tenantHeader = Request.Headers["X-Tenant-Id"].FirstOrDefault();
            if (Guid.TryParse(tenantHeader, out tenantId))
                return tenantId;
            
            // Try to get from HttpContext items (set by middleware)
            if (HttpContext.Items.TryGetValue("TenantId", out var contextTenantId))
            {
                switch (contextTenantId)
                {
                    case Guid guidValue:
                        return guidValue;
                    case string tenantString when Guid.TryParse(tenantString, out var parsedGuid):
                        return parsedGuid;
                }
            }
            
            // Return null if not found (let RequireTenantId handle the error)
            return null;
        }
    }

    /// <summary>
    /// Gets the user's email from claims
    /// </summary>
    protected string? CurrentUserEmail => User.FindFirst(ClaimTypes.Email)?.Value 
        ?? User.FindFirst("email")?.Value;

    /// <summary>
    /// Gets the user's role from claims
    /// </summary>
    protected string? CurrentUserRole => User.FindFirst(ClaimTypes.Role)?.Value 
        ?? User.FindFirst("custom:role")?.Value;

    /// <summary>
    /// Checks if the current user has a specific role
    /// </summary>
    protected bool IsInRole(string role) => User.IsInRole(role);

    /// <summary>
    /// Checks if the current user is an admin
    /// </summary>
    protected bool IsAdmin => IsInRole("Admin") || IsInRole("admin");

    /// <summary>
    /// Checks if the current user is a provider
    /// </summary>
    protected bool IsProvider => IsInRole("Provider") || IsInRole("provider");

    /// <summary>
    /// Checks if the current user is a patient
    /// </summary>
    protected bool IsPatient => IsInRole("Patient") || IsInRole("patient");

    /// <summary>
    /// Creates a standard success response
    /// </summary>
    protected IActionResult Success<T>(T data, string? message = null)
    {
        return Ok(new
        {
            success = true,
            data,
            message
        });
    }

    /// <summary>
    /// Creates a paginated success response
    /// </summary>
    protected IActionResult SuccessPaginated<T>(IEnumerable<T> data, int totalCount, int page, int pageSize, string? message = null)
    {
        return Ok(new
        {
            success = true,
            data,
            pagination = new
            {
                total = totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            },
            message
        });
    }

    /// <summary>
    /// Creates a Created (201) response with location header
    /// </summary>
    protected IActionResult Created<T>(T data, string locationPath)
    {
        return base.Created(locationPath, new
        {
            success = true,
            data
        });
    }

    /// <summary>
    /// Creates a No Content (204) response
    /// </summary>
    protected new IActionResult NoContent()
    {
        return base.NoContent();
    }

    /// <summary>
    /// Validates that a required tenant ID is present
    /// </summary>
    protected Guid RequireTenantId()
    {
        var tenantId = CurrentTenantId;
        if (!tenantId.HasValue)
        {
            // For development/demo purposes, use the first available tenant
            // In production, this should be properly resolved from authentication
            var firstTenant = HttpContext.RequestServices.GetService<QivrDbContext>()?
                .Tenants.FirstOrDefault()?.Id;
            
            if (firstTenant.HasValue)
            {
                return firstTenant.Value;
            }
            
            throw new UnauthorizedException("Tenant context required for this operation");
        }
        return tenantId.Value;
    }

    /// <summary>
    /// Validates that the current user has permission to access a specific resource
    /// </summary>
    protected void RequireResourceOwnership(Guid resourceOwnerId, string resourceType = "resource")
    {
        if (resourceOwnerId != CurrentUserId && !IsAdmin)
        {
            throw new ForbiddenException($"You don't have permission to access this {resourceType}");
        }
    }

    /// <summary>
    /// Validates model state and throws ValidationException if invalid
    /// </summary>
    protected void ValidateModel()
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState
                .Where(x => x.Value?.Errors.Count > 0)
                .ToDictionary(
                    x => x.Key,
                    x => x.Value!.Errors.Select(e => e.ErrorMessage).ToArray()
                );

            throw new ValidationException(errors);
        }
    }

    /// <summary>
    /// Gets the client IP address
    /// </summary>
    protected string? GetClientIpAddress()
    {
        return HttpContext.Connection.RemoteIpAddress?.ToString();
    }

    /// <summary>
    /// Gets a request header value
    /// </summary>
    protected string? GetHeader(string headerName)
    {
        return HttpContext.Request.Headers[headerName].FirstOrDefault();
    }

    /// <summary>
    /// Logs an action for audit purposes
    /// </summary>
    protected void LogAudit(string action, object? details = null)
    {
        var logger = HttpContext.RequestServices.GetService<ILogger<BaseApiController>>();
        logger?.LogInformation("Audit: {Action} by {UserId} from {IpAddress}",
            action, CurrentUserId, GetClientIpAddress());
    }
}
