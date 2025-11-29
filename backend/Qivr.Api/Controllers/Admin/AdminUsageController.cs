using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/usage")]
[Authorize]
public class AdminUsageController : ControllerBase
{
    private readonly QivrDbContext _context;

    public AdminUsageController(QivrDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllUsage([FromQuery] string? period, CancellationToken ct)
    {
        var startDate = DateTime.UtcNow.AddDays(-30);
        if (!string.IsNullOrEmpty(period) && DateTime.TryParse(period + "-01", out var d))
            startDate = d;

        var tenants = await _context.Tenants
            .Where(t => t.DeletedAt == null)
            .Select(t => new
            {
                t.Id,
                t.Name,
                t.Plan,
                Patients = t.Users.Count(u => u.UserType == UserType.Patient && u.DeletedAt == null),
                Practitioners = t.Users.Count(u => u.UserType == UserType.Staff || u.UserType == UserType.Admin),
            })
            .ToListAsync(ct);

        var usage = new List<object>();
        foreach (var t in tenants)
        {
            var appointments = await _context.Appointments.CountAsync(a => a.TenantId == t.Id && a.CreatedAt >= startDate, ct);
            var documents = await _context.Documents.CountAsync(d => d.TenantId == t.Id && d.CreatedAt >= startDate, ct);
            var messages = await _context.Messages.CountAsync(m => m.TenantId == t.Id && m.CreatedAt >= startDate, ct);

            usage.Add(new
            {
                tenantId = t.Id,
                tenantName = t.Name,
                plan = t.Plan,
                activePatients = t.Patients,
                practitioners = t.Practitioners,
                appointments,
                documents,
                messages,
                apiCalls = appointments * 10 + documents * 5 + messages * 2,
            });
        }

        return Ok(usage.OrderByDescending(u => ((dynamic)u).activePatients));
    }

    [HttpGet("totals")]
    public async Task<IActionResult> GetUsageTotals(CancellationToken ct)
    {
        var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        return Ok(new
        {
            totalPatients = await _context.Users.CountAsync(u => u.UserType == UserType.Patient && u.DeletedAt == null, ct),
            totalPractitioners = await _context.Users.CountAsync(u => (u.UserType == UserType.Staff || u.UserType == UserType.Admin) && u.DeletedAt == null, ct),
            appointmentsThisMonth = await _context.Appointments.CountAsync(a => a.CreatedAt >= startOfMonth, ct),
            documentsThisMonth = await _context.Documents.CountAsync(d => d.CreatedAt >= startOfMonth, ct),
            messagesThisMonth = await _context.Messages.CountAsync(m => m.CreatedAt >= startOfMonth, ct),
            totalTenants = await _context.Tenants.CountAsync(t => t.DeletedAt == null, ct),
        });
    }
}
