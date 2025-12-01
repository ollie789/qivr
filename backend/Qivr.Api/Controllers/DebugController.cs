using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Controllers;

/// <summary>
/// Debug endpoints - restricted to SuperAdmin only.
/// These should be disabled in production.
/// </summary>
[ApiController]
[Route("api/debug")]
[Authorize(Roles = "SuperAdmin")]
public class DebugController : ControllerBase
{
    private readonly QivrDbContext _context;

    public DebugController(QivrDbContext context)
    {
        _context = context;
    }

    [HttpGet("user-by-cognito/{cognitoSub}")]
    public async Task<IActionResult> GetUserByCognitoSub(string cognitoSub)
    {
        var user = await _context.Users
            .Include(u => u.Tenant)
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.CognitoSub == cognitoSub);

        if (user == null)
            return NotFound($"No user found with CognitoSub: {cognitoSub}");

        return Ok(new
        {
            user.Id,
            user.CognitoSub,
            user.Email,
            user.FirstName,
            user.LastName,
            user.UserType,
            Tenant = user.Tenant != null ? new
            {
                user.Tenant.Id,
                user.Tenant.Name,
                user.Tenant.Status
            } : null,
            UserRoles = user.UserRoles.Select(ur => new
            {
                ur.RoleId,
                ur.Role?.Name
            })
        });
    }

    [HttpGet("tenant/{tenantId}")]
    public async Task<IActionResult> GetTenant(Guid tenantId)
    {
        var tenant = await _context.Tenants
            .Include(t => t.Users)
            .FirstOrDefaultAsync(t => t.Id == tenantId);

        if (tenant == null)
            return NotFound($"No tenant found with ID: {tenantId}");

        return Ok(new
        {
            tenant.Id,
            tenant.Name,
            tenant.Status,
            Users = tenant.Users.Select(u => new
            {
                u.Id,
                u.Email,
                u.CognitoSub,
                u.UserType
            })
        });
    }

    [HttpPost("assign-user-to-tenant")]
    public async Task<IActionResult> AssignUserToTenant([FromBody] AssignUserRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.CognitoSub == request.CognitoSub);
        if (user == null)
            return NotFound($"User not found: {request.CognitoSub}");

        var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == request.TenantId);
        if (tenant == null)
            return NotFound($"Tenant not found: {request.TenantId}");

        user.TenantId = request.TenantId;
        await _context.SaveChangesAsync();

        return Ok("User assigned to tenant");
    }

    [HttpGet("all-users")]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _context.Users
            .Include(u => u.Tenant)
            .Take(50)
            .Select(u => new
            {
                u.Id,
                u.CognitoSub,
                u.Email,
                u.FirstName,
                u.LastName,
                u.UserType,
                TenantId = u.TenantId,
                TenantName = u.Tenant != null ? u.Tenant.Name : null
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("all-tenants")]
    public async Task<IActionResult> GetAllTenants()
    {
        var tenants = await _context.Tenants
            .Select(t => new
            {
                t.Id,
                t.Name,
                t.Status,
                UserCount = t.Users.Count()
            })
            .ToListAsync();

        return Ok(tenants);
    }
}

public class AssignUserRequest
{
    public string CognitoSub { get; set; } = string.Empty;
    public Guid TenantId { get; set; }
}
