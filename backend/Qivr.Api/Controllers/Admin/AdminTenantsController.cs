using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/tenants")]
[Authorize] // Any authenticated user from admin pool can access
public class AdminTenantsController : ControllerBase
{
    private readonly QivrDbContext _context;
    private readonly ILogger<AdminTenantsController> _logger;

    public AdminTenantsController(QivrDbContext context, ILogger<AdminTenantsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllTenants([FromQuery] string? search, [FromQuery] string? status, CancellationToken ct)
    {
        var query = _context.Tenants.Where(t => t.DeletedAt == null);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(t => t.Name.Contains(search) || t.Email!.Contains(search));

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<TenantStatus>(status, true, out var s))
            query = query.Where(t => t.Status == s);

        var tenants = await query
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new AdminTenantDto
            {
                Id = t.Id,
                Name = t.Name,
                Slug = t.Slug,
                Status = t.Status.ToString().ToLower(),
                Plan = t.Plan,
                ContactEmail = t.Email,
                ContactName = t.Users.Where(u => u.UserType == UserType.Admin).Select(u => u.FirstName + " " + u.LastName).FirstOrDefault(),
                CreatedAt = t.CreatedAt,
                PatientCount = t.Users.Count(u => u.UserType == UserType.Patient),
                PractitionerCount = t.Users.Count(u => u.UserType == UserType.Staff || u.UserType == UserType.Admin),
                FeatureFlags = t.Settings,
            })
            .ToListAsync(ct);

        return Ok(tenants);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetTenant(Guid id, CancellationToken ct)
    {
        var tenant = await _context.Tenants
            .Where(t => t.Id == id)
            .Select(t => new AdminTenantDetailDto
            {
                Id = t.Id,
                Name = t.Name,
                Slug = t.Slug,
                Status = t.Status.ToString().ToLower(),
                Plan = t.Plan,
                ContactEmail = t.Email,
                Phone = t.Phone,
                Address = t.Address,
                City = t.City,
                State = t.State,
                CreatedAt = t.CreatedAt,
                CognitoUserPoolId = t.CognitoUserPoolId,
                FeatureFlags = t.Settings,
                Metadata = t.Metadata,
                PatientCount = t.Users.Count(u => u.UserType == UserType.Patient),
                PractitionerCount = t.Users.Count(u => u.UserType == UserType.Staff || u.UserType == UserType.Admin),
            })
            .FirstOrDefaultAsync(ct);

        if (tenant == null) return NotFound();
        return Ok(tenant);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateTenant(Guid id, [FromBody] UpdateTenantRequest request, CancellationToken ct)
    {
        var tenant = await _context.Tenants.FindAsync(new object[] { id }, ct);
        if (tenant == null) return NotFound();

        if (!string.IsNullOrEmpty(request.Name)) tenant.Name = request.Name;
        if (!string.IsNullOrEmpty(request.Plan)) tenant.Plan = request.Plan;
        if (!string.IsNullOrEmpty(request.Email)) tenant.Email = request.Email;
        if (!string.IsNullOrEmpty(request.Phone)) tenant.Phone = request.Phone;
        if (!string.IsNullOrEmpty(request.Address)) tenant.Address = request.Address;

        tenant.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("Tenant {TenantId} updated by admin", id);
        return Ok(new { success = true });
    }

    [HttpPost("{id:guid}/suspend")]
    public async Task<IActionResult> SuspendTenant(Guid id, CancellationToken ct)
    {
        var tenant = await _context.Tenants.FindAsync(new object[] { id }, ct);
        if (tenant == null) return NotFound();

        tenant.Status = TenantStatus.Suspended;
        tenant.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        _logger.LogWarning("Tenant {TenantId} suspended by admin", id);
        return Ok(new { success = true, status = "suspended" });
    }

    [HttpPost("{id:guid}/activate")]
    public async Task<IActionResult> ActivateTenant(Guid id, CancellationToken ct)
    {
        var tenant = await _context.Tenants.FindAsync(new object[] { id }, ct);
        if (tenant == null) return NotFound();

        tenant.Status = TenantStatus.Active;
        tenant.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("Tenant {TenantId} activated by admin", id);
        return Ok(new { success = true, status = "active" });
    }

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

    [HttpGet("{id:guid}/usage")]
    public async Task<IActionResult> GetTenantUsage(Guid id, [FromQuery] string? period, CancellationToken ct)
    {
        var tenant = await _context.Tenants.FindAsync(new object[] { id }, ct);
        if (tenant == null) return NotFound();

        var startDate = DateTime.UtcNow.AddDays(-30);
        if (!string.IsNullOrEmpty(period) && DateTime.TryParse(period + "-01", out var d))
            startDate = d;

        var usage = new TenantUsageDto
        {
            TenantId = id,
            Period = startDate.ToString("yyyy-MM"),
            ActivePatients = await _context.Users.CountAsync(u => u.TenantId == id && u.UserType == UserType.Patient && u.DeletedAt == null, ct),
            Appointments = await _context.Appointments.CountAsync(a => a.TenantId == id && a.CreatedAt >= startDate, ct),
            Documents = await _context.Documents.CountAsync(d => d.TenantId == id && d.CreatedAt >= startDate, ct),
            Messages = await _context.Messages.CountAsync(m => m.TenantId == id && m.CreatedAt >= startDate, ct),
        };

        return Ok(usage);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteTenant(Guid id, CancellationToken ct)
    {
        var tenant = await _context.Tenants.FindAsync(new object[] { id }, ct);
        if (tenant == null) return NotFound();

        // Soft delete
        tenant.DeletedAt = DateTime.UtcNow;
        tenant.Status = TenantStatus.Cancelled;
        await _context.SaveChangesAsync(ct);

        _logger.LogWarning("Tenant {TenantId} soft-deleted by admin", id);
        return Ok(new { success = true });
    }
}

public class AdminTenantDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string Slug { get; set; } = "";
    public string Status { get; set; } = "";
    public string Plan { get; set; } = "";
    public string? ContactEmail { get; set; }
    public string? ContactName { get; set; }
    public DateTime CreatedAt { get; set; }
    public int PatientCount { get; set; }
    public int PractitionerCount { get; set; }
    public Dictionary<string, object>? FeatureFlags { get; set; }
}

public class AdminTenantDetailDto : AdminTenantDto
{
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? CognitoUserPoolId { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
}

public class UpdateTenantRequest
{
    public string? Name { get; set; }
    public string? Plan { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
}

public class TenantUsageDto
{
    public Guid TenantId { get; set; }
    public string Period { get; set; } = "";
    public int ActivePatients { get; set; }
    public int Appointments { get; set; }
    public int Documents { get; set; }
    public int Messages { get; set; }
}
