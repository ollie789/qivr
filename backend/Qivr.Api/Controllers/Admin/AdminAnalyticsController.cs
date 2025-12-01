using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Controllers.Admin;

/// <summary>
/// Admin analytics using read replica database.
/// </summary>
[ApiController]
[Route("api/admin/analytics")]
[Authorize]
public class AdminAnalyticsController : ControllerBase
{
    private readonly AdminReadOnlyDbContext _db;
    private readonly ILogger<AdminAnalyticsController> _logger;

    public AdminAnalyticsController(AdminReadOnlyDbContext db, ILogger<AdminAnalyticsController> logger)
    {
        _db = db;
        _logger = logger;
    }

    [HttpGet("tenants")]
    public async Task<IActionResult> GetTenants(CancellationToken ct)
    {
        var tenants = await _db.Tenants
            .Where(t => t.DeletedAt == null)
            .Select(t => new
            {
                t.Id,
                t.Name,
                t.Slug,
                Status = t.Status.ToString().ToLower(),
                Plan = t.Plan,
                t.CreatedAt,
                PatientCount = _db.Users.Count(u => u.TenantId == t.Id && u.UserType == Qivr.Core.Entities.UserType.Patient && u.DeletedAt == null),
                StaffCount = _db.Users.Count(u => u.TenantId == t.Id && u.UserType != Qivr.Core.Entities.UserType.Patient && u.DeletedAt == null)
            })
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(ct);

        return Ok(tenants);
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardStats(CancellationToken ct)
    {
        var tenants = await _db.Tenants.Where(t => t.DeletedAt == null).ToListAsync(ct);
        var activeTenants = tenants.Count(t => t.Status == Qivr.Core.Entities.TenantStatus.Active);
        var totalPatients = await _db.Users.CountAsync(u => u.UserType == Qivr.Core.Entities.UserType.Patient && u.DeletedAt == null, ct);
        var totalStaff = await _db.Users.CountAsync(u => u.UserType != Qivr.Core.Entities.UserType.Patient && u.DeletedAt == null, ct);

        var mrr = tenants.Sum(t => t.Plan.ToLower() switch
        {
            "starter" => 99,
            "professional" => 299,
            "enterprise" => 599,
            _ => 0
        });

        return Ok(new
        {
            totalTenants = tenants.Count.ToString(),
            activeTenants = activeTenants.ToString(),
            totalPatients = totalPatients.ToString(),
            totalStaff = totalStaff.ToString(),
            mrr = mrr.ToString(),
            mrrFormatted = $"${mrr:N0}"
        });
    }

    [HttpGet("usage")]
    public async Task<IActionResult> GetUsageStats([FromQuery] int days = 30, CancellationToken ct = default)
    {
        var since = DateTime.UtcNow.AddDays(-days);
        
        var usage = await _db.Tenants
            .Where(t => t.DeletedAt == null)
            .Select(t => new
            {
                TenantId = t.Id,
                TenantName = t.Name,
                Appointments = _db.Appointments.Count(a => a.TenantId == t.Id && a.CreatedAt >= since),
                Patients = _db.Users.Count(u => u.TenantId == t.Id && u.UserType == Qivr.Core.Entities.UserType.Patient && u.CreatedAt >= since),
                Documents = 0 // TODO: Add document count when available
            })
            .ToListAsync(ct);

        return Ok(usage);
    }

    [HttpGet("prom-outcomes")]
    public async Task<IActionResult> GetPromOutcomes([FromQuery] string? region, [FromQuery] string? promType, CancellationToken ct = default)
    {
        // Return aggregated PROM data - placeholder until analytics pipeline is set up
        return Ok(new List<object>());
    }

    [HttpGet("revenue-trend")]
    public async Task<IActionResult> GetRevenueTrend([FromQuery] int months = 6, CancellationToken ct = default)
    {
        var since = DateTime.UtcNow.AddMonths(-months);
        
        var tenantsByMonth = await _db.Tenants
            .Where(t => t.CreatedAt >= since && t.DeletedAt == null)
            .GroupBy(t => new { t.CreatedAt.Year, t.CreatedAt.Month })
            .Select(g => new
            {
                Month = $"{g.Key.Year}-{g.Key.Month:D2}",
                NewTenants = g.Count(),
                MrrAdded = g.Sum(t => t.Plan.ToLower() == "starter" ? 99 :
                                      t.Plan.ToLower() == "professional" ? 299 :
                                      t.Plan.ToLower() == "enterprise" ? 599 : 0)
            })
            .OrderBy(x => x.Month)
            .ToListAsync(ct);

        return Ok(tenantsByMonth);
    }
}
