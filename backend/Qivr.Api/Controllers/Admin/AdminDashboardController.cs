using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/dashboard")]
[Authorize]
public class AdminDashboardController : ControllerBase
{
    private readonly QivrDbContext _context;

    public AdminDashboardController(QivrDbContext context)
    {
        _context = context;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetDashboardStats(CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var startOfLastMonth = startOfMonth.AddMonths(-1);

        var totalTenants = await _context.Tenants.CountAsync(t => t.DeletedAt == null, ct);
        var activeTenants = await _context.Tenants.CountAsync(t => t.Status == TenantStatus.Active && t.DeletedAt == null, ct);
        var newTenantsThisMonth = await _context.Tenants.CountAsync(t => t.CreatedAt >= startOfMonth && t.DeletedAt == null, ct);

        var totalPatients = await _context.Users.CountAsync(u => u.UserType == UserType.Patient && u.DeletedAt == null, ct);
        var patientsLastMonth = await _context.Users.CountAsync(u => u.UserType == UserType.Patient && u.CreatedAt < startOfMonth && u.DeletedAt == null, ct);
        var patientGrowth = patientsLastMonth > 0 ? ((totalPatients - patientsLastMonth) * 100.0 / patientsLastMonth) : 0;

        var appointmentsThisMonth = await _context.Appointments.CountAsync(a => a.CreatedAt >= startOfMonth, ct);

        // Calculate MRR based on plan tiers
        var planPrices = new Dictionary<string, decimal>
        {
            { "starter", 99m },
            { "professional", 299m },
            { "enterprise", 599m }
        };

        var mrr = await _context.Tenants
            .Where(t => t.Status == TenantStatus.Active && t.DeletedAt == null)
            .Select(t => t.Plan)
            .ToListAsync(ct);

        var totalMrr = mrr.Sum(p => planPrices.GetValueOrDefault(p?.ToLower() ?? "starter", 99m));

        return Ok(new
        {
            totalTenants,
            activeTenants,
            newTenantsThisMonth,
            totalPatients,
            patientGrowthPercent = Math.Round(patientGrowth, 1),
            appointmentsThisMonth,
            mrr = totalMrr,
            mrrFormatted = $"${totalMrr:N0}"
        });
    }

    [HttpGet("activity")]
    public async Task<IActionResult> GetRecentActivity(CancellationToken ct)
    {
        var activities = new List<object>();

        // Recent tenant signups
        var recentTenants = await _context.Tenants
            .Where(t => t.DeletedAt == null)
            .OrderByDescending(t => t.CreatedAt)
            .Take(5)
            .Select(t => new { t.Name, t.CreatedAt, Type = "tenant_created" })
            .ToListAsync(ct);

        foreach (var t in recentTenants)
            activities.Add(new { type = t.Type, message = $"New tenant: {t.Name}", timestamp = t.CreatedAt });

        // Recent appointments
        var recentAppointments = await _context.Appointments
            .IgnoreQueryFilters()
            .OrderByDescending(a => a.CreatedAt)
            .Take(3)
            .Join(_context.Tenants, a => a.TenantId, t => t.Id, (a, t) => new { TenantName = t.Name, a.CreatedAt })
            .ToListAsync(ct);

        foreach (var a in recentAppointments)
            activities.Add(new { type = "appointment", message = $"Appointment booked: {a.TenantName}", timestamp = a.CreatedAt });

        return Ok(activities.OrderByDescending(a => ((dynamic)a).timestamp).Take(10));
    }

    [HttpGet("revenue")]
    public async Task<IActionResult> GetRevenueData([FromQuery] int months = 6, CancellationToken ct = default)
    {
        var planPrices = new Dictionary<string, decimal>
        {
            { "starter", 99m },
            { "professional", 299m },
            { "enterprise", 599m }
        };

        var data = new List<object>();
        var now = DateTime.UtcNow;

        for (int i = months - 1; i >= 0; i--)
        {
            var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-i);
            var monthEnd = monthStart.AddMonths(1);

            var activePlans = await _context.Tenants
                .Where(t => t.CreatedAt < monthEnd && t.Status == TenantStatus.Active && (t.DeletedAt == null || t.DeletedAt > monthEnd))
                .Select(t => t.Plan)
                .ToListAsync(ct);

            var mrr = activePlans.Sum(p => planPrices.GetValueOrDefault(p?.ToLower() ?? "starter", 99m));

            data.Add(new
            {
                month = monthStart.ToString("MMM yyyy"),
                mrr,
                tenants = activePlans.Count
            });
        }

        return Ok(data);
    }
}
