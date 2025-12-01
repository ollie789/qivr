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
    /// Get tenant details including usage stats
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetTenant(Guid id, CancellationToken ct)
    {
        var tenant = await _context.Tenants
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id, ct);

        if (tenant == null) return NotFound();

        // Get usage stats
        var patientCount = await _context.Users
            .CountAsync(u => u.TenantId == id && u.UserType == UserType.Patient && u.DeletedAt == null, ct);
        var staffCount = await _context.Users
            .CountAsync(u => u.TenantId == id && u.UserType != UserType.Patient && u.DeletedAt == null, ct);
        var appointmentCount = await _context.Appointments
            .CountAsync(a => a.TenantId == id && a.ScheduledStart >= DateTime.UtcNow.AddMonths(-1), ct);

        // Feature flags from Settings
        var featureFlags = new Dictionary<string, bool>
        {
            ["aiTriage"] = tenant.Settings.TryGetValue("aiTriage", out var at) && Convert.ToBoolean(at),
            ["aiTreatmentPlans"] = tenant.Settings.TryGetValue("aiTreatmentPlans", out var atp) && Convert.ToBoolean(atp),
            ["documentOcr"] = tenant.Settings.TryGetValue("documentOcr", out var doc) && Convert.ToBoolean(doc),
            ["smsReminders"] = tenant.Settings.TryGetValue("smsReminders", out var sms) && Convert.ToBoolean(sms),
            ["apiAccess"] = tenant.Settings.TryGetValue("apiAccess", out var api) && Convert.ToBoolean(api),
            ["customBranding"] = tenant.Settings.TryGetValue("customBranding", out var cb) && Convert.ToBoolean(cb),
            ["hipaaAuditLogs"] = tenant.Settings.TryGetValue("hipaaAuditLogs", out var hal) && Convert.ToBoolean(hal),
        };

        // Plan limits based on tier
        var limits = GetPlanLimits(tenant.Plan);

        return Ok(new TenantDetailResponse
        {
            Id = tenant.Id,
            Name = tenant.Name,
            Slug = tenant.Slug,
            Status = tenant.Status.ToString().ToLower(),
            PlanTier = tenant.Plan,
            CreatedAt = tenant.CreatedAt,
            ContactEmail = tenant.Email,
            Phone = tenant.Phone,
            Address = tenant.Address,
            City = tenant.City,
            State = tenant.State,
            ZipCode = tenant.ZipCode,
            Country = tenant.Country,
            Timezone = tenant.Timezone,
            FeatureFlags = featureFlags,
            Usage = new UsageStats
            {
                Patients = patientCount,
                Staff = staffCount,
                AppointmentsThisMonth = appointmentCount
            },
            Limits = limits
        });
    }

    private static PlanLimits GetPlanLimits(string plan) => plan.ToLower() switch
    {
        "starter" => new PlanLimits { MaxStaff = 3, MaxPatients = 500, MaxStorageGb = 10, MaxAiCallsPerMonth = 100 },
        "professional" => new PlanLimits { MaxStaff = 10, MaxPatients = 2000, MaxStorageGb = 50, MaxAiCallsPerMonth = 1000 },
        "enterprise" => new PlanLimits { MaxStaff = 50, MaxPatients = 10000, MaxStorageGb = 500, MaxAiCallsPerMonth = 10000 },
        _ => new PlanLimits { MaxStaff = 3, MaxPatients = 500, MaxStorageGb = 10, MaxAiCallsPerMonth = 100 }
    };

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

public class TenantDetailResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string PlanTier { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string? ContactEmail { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? ZipCode { get; set; }
    public string? Country { get; set; }
    public string? Timezone { get; set; }
    public Dictionary<string, bool> FeatureFlags { get; set; } = new();
    public UsageStats Usage { get; set; } = new();
    public PlanLimits Limits { get; set; } = new();
}

public class UsageStats
{
    public int Patients { get; set; }
    public int Staff { get; set; }
    public int AppointmentsThisMonth { get; set; }
}

public class PlanLimits
{
    public int MaxStaff { get; set; }
    public int MaxPatients { get; set; }
    public int MaxStorageGb { get; set; }
    public int MaxAiCallsPerMonth { get; set; }
}
