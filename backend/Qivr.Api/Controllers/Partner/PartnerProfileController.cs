using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Controllers.Partner;

/// <summary>
/// Partner profile and affiliations API.
/// Allows partners to view their profile and affiliated clinics.
/// </summary>
[ApiController]
[Route("api/research-partner")]
[Authorize(Policy = "Partner")]
public class PartnerProfileController : ControllerBase
{
    private readonly AdminReadOnlyDbContext _context;
    private readonly ILogger<PartnerProfileController> _logger;

    public PartnerProfileController(
        AdminReadOnlyDbContext context,
        ILogger<PartnerProfileController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get current partner profile
    /// </summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetProfile(CancellationToken ct)
    {
        var partnerId = GetPartnerId();
        if (partnerId == null) return Unauthorized();

        var partner = await _context.ResearchPartners
            .FirstOrDefaultAsync(p => p.Id == partnerId, ct);

        if (partner == null)
            return NotFound(new { error = "Partner not found" });

        var deviceCount = await _context.MedicalDevices
            .CountAsync(d => d.PartnerId == partnerId && d.IsActive, ct);

        var affiliationCount = await _context.PartnerClinicAffiliations
            .CountAsync(a => a.PartnerId == partnerId && a.Status == AffiliationStatus.Active, ct);

        return Ok(new PartnerProfileResponse
        {
            Id = partner.Id,
            Name = partner.Name,
            Slug = partner.Slug,
            LogoUrl = partner.LogoUrl,
            ContactEmail = partner.ContactEmail,
            Website = partner.Website,
            Description = partner.Description,
            DeviceCount = deviceCount,
            AffiliatedClinicCount = affiliationCount
        });
    }

    /// <summary>
    /// Get affiliated clinics for the partner
    /// </summary>
    [HttpGet("affiliations")]
    public async Task<IActionResult> GetAffiliations(CancellationToken ct)
    {
        var partnerId = GetPartnerId();
        if (partnerId == null) return Unauthorized();

        var affiliations = await _context.PartnerClinicAffiliations
            .Where(a => a.PartnerId == partnerId)
            .Include(a => a.Tenant)
            .OrderBy(a => a.Tenant!.Name)
            .Select(a => new AffiliationResponse
            {
                Id = a.Id,
                TenantId = a.TenantId,
                ClinicName = a.Tenant != null ? a.Tenant.Name : "Unknown",
                Status = a.Status.ToString(),
                DataSharingLevel = a.DataSharingLevel.ToString(),
                ApprovedAt = a.ApprovedAt,
                Notes = a.Notes
            })
            .ToListAsync(ct);

        // Get patient counts per clinic (aggregated)
        var activeAffiliationTenantIds = affiliations
            .Where(a => a.Status == "Active")
            .Select(a => a.TenantId)
            .ToList();

        var patientCounts = await _context.PatientDeviceUsages
            .IgnoreQueryFilters()
            .Where(u => activeAffiliationTenantIds.Contains(u.TenantId))
            .Where(u => _context.MedicalDevices.Any(d => d.Id == u.DeviceId && d.PartnerId == partnerId))
            .GroupBy(u => u.TenantId)
            .Select(g => new { TenantId = g.Key, PatientCount = g.Select(x => x.PatientId).Distinct().Count() })
            .ToListAsync(ct);

        foreach (var affiliation in affiliations)
        {
            var count = patientCounts.FirstOrDefault(p => p.TenantId == affiliation.TenantId);
            affiliation.PatientCount = count?.PatientCount ?? 0;
        }

        return Ok(new { affiliations });
    }

    /// <summary>
    /// Get summary statistics for the partner
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats(CancellationToken ct)
    {
        var partnerId = GetPartnerId();
        if (partnerId == null) return Unauthorized();

        var affiliatedTenantIds = await _context.PartnerClinicAffiliations
            .Where(a => a.PartnerId == partnerId && a.Status == AffiliationStatus.Active)
            .Select(a => a.TenantId)
            .ToListAsync(ct);

        var deviceIds = await _context.MedicalDevices
            .Where(d => d.PartnerId == partnerId && d.IsActive)
            .Select(d => d.Id)
            .ToListAsync(ct);

        var usages = await _context.PatientDeviceUsages
            .IgnoreQueryFilters()
            .Where(u => deviceIds.Contains(u.DeviceId) && affiliatedTenantIds.Contains(u.TenantId))
            .ToListAsync(ct);

        var totalPatients = usages.Select(u => u.PatientId).Distinct().Count();
        var totalProcedures = usages.Count;

        // Get PROM response counts
        var treatmentPlanIds = await _context.TreatmentPlans
            .IgnoreQueryFilters()
            .Where(tp => tp.LinkedDeviceUsageId != null &&
                         usages.Select(u => u.Id).Contains(tp.LinkedDeviceUsageId.Value))
            .Select(tp => tp.Id)
            .ToListAsync(ct);

        var promCount = await _context.Set<PromInstance>()
            .IgnoreQueryFilters()
            .CountAsync(p => p.TreatmentPlanId != null &&
                            treatmentPlanIds.Contains(p.TreatmentPlanId.Value) &&
                            p.Status == PromStatus.Completed, ct);

        // Get monthly procedure trend (last 12 months)
        var twelveMonthsAgo = DateTime.UtcNow.AddMonths(-12);
        var monthlyTrend = usages
            .Where(u => u.ProcedureDate >= twelveMonthsAgo)
            .GroupBy(u => new { u.ProcedureDate.Year, u.ProcedureDate.Month })
            .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
            .Select(g => new MonthlyDataPoint
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                ProcedureCount = g.Count(),
                PatientCount = g.Select(x => x.PatientId).Distinct().Count()
            })
            .ToList();

        return Ok(new PartnerStatsResponse
        {
            TotalDevices = deviceIds.Count,
            TotalAffiliatedClinics = affiliatedTenantIds.Count,
            TotalPatients = totalPatients,
            TotalProcedures = totalProcedures,
            TotalPromResponses = promCount,
            MonthlyTrend = monthlyTrend
        });
    }

    /// <summary>
    /// Export outcome data (CSV format)
    /// </summary>
    [HttpGet("export")]
    public async Task<IActionResult> ExportData(
        [FromQuery] string format = "csv",
        [FromQuery] Guid? deviceId = null,
        CancellationToken ct = default)
    {
        var partnerId = GetPartnerId();
        if (partnerId == null) return Unauthorized();

        var affiliatedTenantIds = await _context.PartnerClinicAffiliations
            .Where(a => a.PartnerId == partnerId && a.Status == AffiliationStatus.Active)
            .Select(a => a.TenantId)
            .ToListAsync(ct);

        var deviceQuery = _context.MedicalDevices
            .Where(d => d.PartnerId == partnerId && d.IsActive);

        if (deviceId.HasValue)
            deviceQuery = deviceQuery.Where(d => d.Id == deviceId.Value);

        var devices = await deviceQuery.ToListAsync(ct);
        var deviceIds = devices.Select(d => d.Id).ToList();

        var usages = await _context.PatientDeviceUsages
            .IgnoreQueryFilters()
            .Where(u => deviceIds.Contains(u.DeviceId) && affiliatedTenantIds.Contains(u.TenantId))
            .Include(u => u.Device)
            .ToListAsync(ct);

        // Build CSV
        var csv = new System.Text.StringBuilder();
        csv.AppendLine("DeviceId,DeviceName,DeviceCode,Category,BodyRegion,ProcedureDate,ProcedureType,ImplantLocation,PatientCount");

        // Aggregate by device and month for privacy
        var aggregated = usages
            .GroupBy(u => new
            {
                u.DeviceId,
                DeviceName = u.Device?.Name ?? "Unknown",
                DeviceCode = u.Device?.DeviceCode ?? "",
                Category = u.Device?.Category ?? "",
                BodyRegion = u.Device?.BodyRegion ?? "",
                Year = u.ProcedureDate.Year,
                Month = u.ProcedureDate.Month
            })
            .Where(g => g.Select(x => x.PatientId).Distinct().Count() >= 5) // K-anonymity
            .Select(g => new
            {
                g.Key.DeviceId,
                g.Key.DeviceName,
                g.Key.DeviceCode,
                g.Key.Category,
                g.Key.BodyRegion,
                ProcedureMonth = $"{g.Key.Year}-{g.Key.Month:D2}",
                PatientCount = g.Select(x => x.PatientId).Distinct().Count()
            });

        foreach (var row in aggregated)
        {
            csv.AppendLine($"{row.DeviceId},{EscapeCsv(row.DeviceName)},{EscapeCsv(row.DeviceCode)},{EscapeCsv(row.Category)},{EscapeCsv(row.BodyRegion)},{row.ProcedureMonth},,{row.PatientCount}");
        }

        var bytes = System.Text.Encoding.UTF8.GetBytes(csv.ToString());
        return File(bytes, "text/csv", $"device-outcomes-{DateTime.UtcNow:yyyy-MM-dd}.csv");
    }

    private static string EscapeCsv(string? value)
    {
        if (string.IsNullOrEmpty(value)) return "";
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
            return $"\"{value.Replace("\"", "\"\"")}\"";
        return value;
    }

    private Guid? GetPartnerId()
    {
        var partnerClaim = User.FindFirst("partner_id")?.Value
            ?? User.FindFirst("custom:partner_id")?.Value;
        return Guid.TryParse(partnerClaim, out var id) ? id : null;
    }
}

// Response DTOs
public class PartnerProfileResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string? ContactEmail { get; set; }
    public string? Website { get; set; }
    public string? Description { get; set; }
    public int DeviceCount { get; set; }
    public int AffiliatedClinicCount { get; set; }
}

public class AffiliationResponse
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string ClinicName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string DataSharingLevel { get; set; } = string.Empty;
    public DateTime? ApprovedAt { get; set; }
    public string? Notes { get; set; }
    public int PatientCount { get; set; }
}

public class PartnerStatsResponse
{
    public int TotalDevices { get; set; }
    public int TotalAffiliatedClinics { get; set; }
    public int TotalPatients { get; set; }
    public int TotalProcedures { get; set; }
    public int TotalPromResponses { get; set; }
    public List<MonthlyDataPoint> MonthlyTrend { get; set; } = new();
}

public class MonthlyDataPoint
{
    public int Year { get; set; }
    public int Month { get; set; }
    public int ProcedureCount { get; set; }
    public int PatientCount { get; set; }
}
