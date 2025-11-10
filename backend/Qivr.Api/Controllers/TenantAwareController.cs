using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace Qivr.Api.Controllers;

[Authorize]
public abstract class TenantAwareController : ControllerBase
{
    protected Guid? GetCurrentTenantId()
    {
        // Try to get tenant from claims first (set by middleware)
        var tenantClaim = User.FindFirst("tenant_id")?.Value;
        if (!string.IsNullOrEmpty(tenantClaim) && Guid.TryParse(tenantClaim, out var tenantFromClaim))
        {
            return tenantFromClaim;
        }

        // Fallback to header (for backwards compatibility)
        var tenantHeader = Request.Headers["X-Tenant-Id"].FirstOrDefault();
        if (!string.IsNullOrEmpty(tenantHeader) && Guid.TryParse(tenantHeader, out var tenantFromHeader))
        {
            return tenantFromHeader;
        }

        return null;
    }

    protected Guid? GetCurrentUserId()
    {
        var userClaim = User.FindFirst("user_id")?.Value;
        if (!string.IsNullOrEmpty(userClaim) && Guid.TryParse(userClaim, out var userId))
        {
            return userId;
        }
        return null;
    }

    protected string? GetUserStatus()
    {
        return User.FindFirst("user_status")?.Value;
    }

    protected IActionResult RequireTenant()
    {
        var status = GetUserStatus();
        
        if (status == "needs_onboarding")
        {
            return BadRequest(new { 
                error = "User needs onboarding", 
                redirectTo = "/onboarding",
                cognitoSub = User.FindFirst("cognito_sub")?.Value 
            });
        }

        if (status == "needs_tenant")
        {
            return BadRequest(new { 
                error = "User needs tenant assignment", 
                redirectTo = "/register-clinic" 
            });
        }

        var tenantId = GetCurrentTenantId();
        if (tenantId == null)
        {
            return BadRequest(new { 
                error = "Tenant context required", 
                redirectTo = "/select-tenant" 
            });
        }

        return Ok();
    }
}
