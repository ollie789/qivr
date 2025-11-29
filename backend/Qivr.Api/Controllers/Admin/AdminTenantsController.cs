using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Controllers.Admin;

/// <summary>
/// Tenant management actions that require production DB write access.
/// Read operations should use AdminAnalyticsController (Athena) instead.
/// </summary>
[ApiController]
[Route("api/admin/tenants")]
[Authorize]
public class AdminTenantsController : ControllerBase
{
    private readonly QivrDbContext _context;
    private readonly ILogger<AdminTenantsController> _logger;

    public AdminTenantsController(QivrDbContext context, ILogger<AdminTenantsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Suspend a tenant (disables login)
    /// </summary>
    [HttpPost("{id:guid}/suspend")]
    public async Task<IActionResult> SuspendTenant(Guid id, CancellationToken ct)
    {
        var tenant = await _context.Tenants.FindAsync(new object[] { id }, ct);
        if (tenant == null) return NotFound();

        tenant.Status = TenantStatus.Suspended;
        tenant.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        _logger.LogWarning("Tenant {TenantId} ({TenantName}) suspended by admin", id, tenant.Name);
        return Ok(new { success = true, status = "suspended" });
    }

    /// <summary>
    /// Activate a suspended tenant
    /// </summary>
    [HttpPost("{id:guid}/activate")]
    public async Task<IActionResult> ActivateTenant(Guid id, CancellationToken ct)
    {
        var tenant = await _context.Tenants.FindAsync(new object[] { id }, ct);
        if (tenant == null) return NotFound();

        tenant.Status = TenantStatus.Active;
        tenant.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("Tenant {TenantId} ({TenantName}) activated by admin", id, tenant.Name);
        return Ok(new { success = true, status = "active" });
    }

    /// <summary>
    /// Update tenant plan tier
    /// </summary>
    [HttpPut("{id:guid}/plan")]
    public async Task<IActionResult> UpdatePlan(Guid id, [FromBody] UpdatePlanRequest request, CancellationToken ct)
    {
        var tenant = await _context.Tenants.FindAsync(new object[] { id }, ct);
        if (tenant == null) return NotFound();

        var oldPlan = tenant.Plan;
        tenant.Plan = request.Plan;
        tenant.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("Tenant {TenantId} plan changed: {OldPlan} → {NewPlan}", id, oldPlan, request.Plan);
        return Ok(new { success = true, plan = tenant.Plan });
    }

    /// <summary>
    /// Update feature flags for a tenant
    /// </summary>
    [HttpPut("{id:guid}/features")]
    public async Task<IActionResult> UpdateFeatureFlags(Guid id, [FromBody] Dictionary<string, object> flags, CancellationToken ct)
    {
        var tenant = await _context.Tenants.FindAsync(new object[] { id }, ct);
        if (tenant == null) return NotFound();

        foreach (var (key, value) in flags)
            tenant.Settings[key] = value;

        tenant.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("Feature flags updated for tenant {TenantId}", id);
        return Ok(new { success = true, featureFlags = tenant.Settings });
    }

    /// <summary>
    /// Soft delete a tenant (GDPR - 30 day grace period)
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteTenant(Guid id, CancellationToken ct)
    {
        var tenant = await _context.Tenants.FindAsync(new object[] { id }, ct);
        if (tenant == null) return NotFound();

        tenant.DeletedAt = DateTime.UtcNow;
        tenant.Status = TenantStatus.Cancelled;
        await _context.SaveChangesAsync(ct);

        _logger.LogWarning("Tenant {TenantId} ({TenantName}) marked for deletion by admin", id, tenant.Name);
        return Ok(new { success = true, message = "Tenant will be permanently deleted in 30 days" });
    }
}

public class UpdatePlanRequest
{
    public string Plan { get; set; } = "starter";
}
