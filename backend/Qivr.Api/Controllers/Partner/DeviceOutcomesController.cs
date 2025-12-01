using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Api.Controllers.Partner;

/// <summary>
/// Device outcomes API for research partners.
/// Allows partners to query anonymized/aggregated outcome data for their devices.
/// </summary>
[ApiController]
[Route("api/research-partner/device-outcomes")]
[Authorize(Policy = "Partner")]
public class DeviceOutcomesController : ControllerBase
{
    private readonly AdminReadOnlyDbContext _context;
    private readonly ILogger<DeviceOutcomesController> _logger;
    private const int MinKAnonymity = 5; // Minimum patients for data to be shown

    public DeviceOutcomesController(
        AdminReadOnlyDbContext context,
        ILogger<DeviceOutcomesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get aggregated outcomes summary for a specific device
    /// </summary>
    [HttpGet("{deviceId:guid}/summary")]
    public async Task<IActionResult> GetDeviceOutcomeSummary(
        Guid deviceId,
        [FromQuery] string? promType,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        CancellationToken ct)
    {
        var partnerId = GetPartnerId();
        if (partnerId == null) return Unauthorized(new { error = "Partner ID not found in claims" });

        // Verify device belongs to this partner
        var device = await _context.MedicalDevices
            .Include(d => d.Partner)
            .FirstOrDefaultAsync(d => d.Id == deviceId && d.PartnerId == partnerId, ct);

        if (device == null)
            return NotFound(new { error = "Device not found or not owned by partner" });

        // Get all device usages across affiliated clinics
        var affiliatedTenantIds = await _context.PartnerClinicAffiliations
            .Where(a => a.PartnerId == partnerId && a.Status == AffiliationStatus.Active)
            .Select(a => a.TenantId)
            .ToListAsync(ct);

        var query = _context.PatientDeviceUsages
            .IgnoreQueryFilters() // We need cross-tenant data
            .Where(u => u.DeviceId == deviceId && affiliatedTenantIds.Contains(u.TenantId));

        if (fromDate.HasValue)
            query = query.Where(u => u.ProcedureDate >= fromDate.Value);
        if (toDate.HasValue)
            query = query.Where(u => u.ProcedureDate <= toDate.Value);

        var usages = await query.ToListAsync(ct);
        var usageIds = usages.Select(u => u.Id).ToList();

        // K-anonymity check
        var patientCount = usages.Select(u => u.PatientId).Distinct().Count();
        if (patientCount < MinKAnonymity)
        {
            return Ok(new DeviceOutcomeSummaryResponse
            {
                DeviceId = deviceId,
                DeviceName = device.Name,
                DeviceCode = device.DeviceCode,
                PatientCount = patientCount,
                SupressedDueToPrivacy = true,
                Message = $"Data suppressed: fewer than {MinKAnonymity} patients"
            });
        }

        // Get PROM scores linked to treatment plans that are linked to these device usages
        var treatmentPlanIds = await _context.TreatmentPlans
            .IgnoreQueryFilters()
            .Where(tp => tp.LinkedDeviceUsageId != null && usageIds.Contains(tp.LinkedDeviceUsageId.Value))
            .Select(tp => tp.Id)
            .ToListAsync(ct);

        // Get baseline and follow-up PROM scores
        var promQuery = _context.Set<PromInstance>()
            .IgnoreQueryFilters()
            .Where(p => p.TreatmentPlanId != null && treatmentPlanIds.Contains(p.TreatmentPlanId.Value))
            .Where(p => p.Status == PromStatus.Completed && p.Score.HasValue);

        if (!string.IsNullOrEmpty(promType))
        {
            promQuery = promQuery.Where(p => p.Template != null && p.Template.Key == promType);
        }

        var promInstances = await promQuery
            .Include(p => p.Template)
            .ToListAsync(ct);

        // Calculate outcome statistics
        var baselineProms = promInstances.Where(p => p.InstanceType == PromInstanceType.Baseline).ToList();
        var followUpProms = promInstances.Where(p => p.InstanceType == PromInstanceType.FollowUp).ToList();
        var finalOutcomeProms = promInstances.Where(p => p.InstanceType == PromInstanceType.FinalOutcome).ToList();

        // Group by PROM type for detailed stats
        var promTypeStats = promInstances
            .Where(p => p.Template != null)
            .GroupBy(p => p.Template!.Key)
            .Select(g => new PromTypeOutcomeStats
            {
                PromType = g.Key,
                PromName = g.First().Template?.Name ?? g.Key,
                BaselineCount = g.Count(p => p.InstanceType == PromInstanceType.Baseline),
                BaselineAverageScore = g.Where(p => p.InstanceType == PromInstanceType.Baseline && p.Score.HasValue)
                    .Select(p => p.Score!.Value).DefaultIfEmpty(0).Average(),
                FollowUpCount = g.Count(p => p.InstanceType == PromInstanceType.FollowUp),
                FollowUpAverageScore = g.Where(p => p.InstanceType == PromInstanceType.FollowUp && p.Score.HasValue)
                    .Select(p => p.Score!.Value).DefaultIfEmpty(0).Average(),
                FinalOutcomeCount = g.Count(p => p.InstanceType == PromInstanceType.FinalOutcome),
                FinalOutcomeAverageScore = g.Where(p => p.InstanceType == PromInstanceType.FinalOutcome && p.Score.HasValue)
                    .Select(p => p.Score!.Value).DefaultIfEmpty(0).Average()
            })
            .ToList();

        // Calculate improvement metrics where we have both baseline and follow-up
        foreach (var stat in promTypeStats)
        {
            if (stat.BaselineCount > 0 && (stat.FollowUpCount > 0 || stat.FinalOutcomeCount > 0))
            {
                var latestScore = stat.FinalOutcomeCount > 0 ? stat.FinalOutcomeAverageScore : stat.FollowUpAverageScore;
                stat.AverageImprovement = stat.BaselineAverageScore - latestScore; // Positive = improvement for most PROMs
                stat.PercentImprovement = stat.BaselineAverageScore > 0
                    ? (stat.AverageImprovement / stat.BaselineAverageScore) * 100
                    : 0;
            }
        }

        return Ok(new DeviceOutcomeSummaryResponse
        {
            DeviceId = deviceId,
            DeviceName = device.Name,
            DeviceCode = device.DeviceCode,
            PartnerName = device.Partner?.Name ?? "Unknown",
            Category = device.Category,
            BodyRegion = device.BodyRegion,
            PatientCount = patientCount,
            ProcedureCount = usages.Count,
            TreatmentPlanCount = treatmentPlanIds.Count,
            PromResponseCount = promInstances.Count,
            PromTypeStats = promTypeStats,
            DateRange = new DateRangeInfo
            {
                EarliestProcedure = usages.Min(u => u.ProcedureDate),
                LatestProcedure = usages.Max(u => u.ProcedureDate)
            }
        });
    }

    /// <summary>
    /// Get time-series outcome data for a device (aggregated by time period)
    /// </summary>
    [HttpGet("{deviceId:guid}/timeline")]
    public async Task<IActionResult> GetDeviceOutcomeTimeline(
        Guid deviceId,
        [FromQuery] string promType = "ODI",
        [FromQuery] string groupBy = "month",
        CancellationToken ct = default)
    {
        var partnerId = GetPartnerId();
        if (partnerId == null) return Unauthorized();

        // Verify device belongs to partner
        var device = await _context.MedicalDevices
            .FirstOrDefaultAsync(d => d.Id == deviceId && d.PartnerId == partnerId, ct);

        if (device == null)
            return NotFound(new { error = "Device not found" });

        var affiliatedTenantIds = await _context.PartnerClinicAffiliations
            .Where(a => a.PartnerId == partnerId && a.Status == AffiliationStatus.Active)
            .Select(a => a.TenantId)
            .ToListAsync(ct);

        // Get treatment plans linked to this device
        var treatmentPlanIds = await _context.TreatmentPlans
            .IgnoreQueryFilters()
            .Include(tp => tp.LinkedDeviceUsage)
            .Where(tp => tp.LinkedDeviceUsage != null && tp.LinkedDeviceUsage.DeviceId == deviceId)
            .Where(tp => affiliatedTenantIds.Contains(tp.TenantId))
            .Select(tp => tp.Id)
            .ToListAsync(ct);

        // Get PROM data grouped by weeks post procedure
        var promData = await _context.Set<PromInstance>()
            .IgnoreQueryFilters()
            .Include(p => p.Template)
            .Where(p => p.TreatmentPlanId != null && treatmentPlanIds.Contains(p.TreatmentPlanId.Value))
            .Where(p => p.Status == PromStatus.Completed && p.Score.HasValue)
            .Where(p => p.Template != null && p.Template.Key == promType)
            .Where(p => p.WeeksPostProcedure.HasValue)
            .ToListAsync(ct);

        // Group by weeks post procedure
        var timeline = promData
            .GroupBy(p => p.WeeksPostProcedure!.Value)
            .OrderBy(g => g.Key)
            .Select(g => new TimelineDataPoint
            {
                WeeksPostProcedure = g.Key,
                PatientCount = g.Select(p => p.PatientId).Distinct().Count(),
                AverageScore = g.Average(p => p.Score!.Value),
                MinScore = g.Min(p => p.Score!.Value),
                MaxScore = g.Max(p => p.Score!.Value),
                ResponseCount = g.Count()
            })
            .Where(t => t.PatientCount >= MinKAnonymity) // K-anonymity per time point
            .ToList();

        return Ok(new DeviceOutcomeTimelineResponse
        {
            DeviceId = deviceId,
            DeviceName = device.Name,
            PromType = promType,
            DataPoints = timeline
        });
    }

    /// <summary>
    /// Get all devices for this partner with outcome summary
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetPartnerDevicesWithOutcomes(CancellationToken ct)
    {
        var partnerId = GetPartnerId();
        if (partnerId == null) return Unauthorized();

        var devices = await _context.MedicalDevices
            .Where(d => d.PartnerId == partnerId && d.IsActive)
            .ToListAsync(ct);

        var affiliatedTenantIds = await _context.PartnerClinicAffiliations
            .Where(a => a.PartnerId == partnerId && a.Status == AffiliationStatus.Active)
            .Select(a => a.TenantId)
            .ToListAsync(ct);

        var deviceSummaries = new List<DeviceOutcomeBriefSummary>();

        foreach (var device in devices)
        {
            var usages = await _context.PatientDeviceUsages
                .IgnoreQueryFilters()
                .Where(u => u.DeviceId == device.Id && affiliatedTenantIds.Contains(u.TenantId))
                .ToListAsync(ct);

            var patientCount = usages.Select(u => u.PatientId).Distinct().Count();

            deviceSummaries.Add(new DeviceOutcomeBriefSummary
            {
                DeviceId = device.Id,
                DeviceName = device.Name,
                DeviceCode = device.DeviceCode,
                Category = device.Category,
                BodyRegion = device.BodyRegion,
                PatientCount = patientCount,
                ProcedureCount = usages.Count,
                HasSufficientData = patientCount >= MinKAnonymity
            });
        }

        return Ok(new { devices = deviceSummaries });
    }

    /// <summary>
    /// Get outcome comparison between devices
    /// </summary>
    [HttpPost("compare")]
    public async Task<IActionResult> CompareDeviceOutcomes(
        [FromBody] CompareDevicesRequest request,
        CancellationToken ct)
    {
        var partnerId = GetPartnerId();
        if (partnerId == null) return Unauthorized();

        if (request.DeviceIds == null || request.DeviceIds.Count < 2)
            return BadRequest(new { error = "At least 2 device IDs required for comparison" });

        // Verify all devices belong to partner
        var devices = await _context.MedicalDevices
            .Where(d => request.DeviceIds.Contains(d.Id) && d.PartnerId == partnerId)
            .ToListAsync(ct);

        if (devices.Count != request.DeviceIds.Count)
            return BadRequest(new { error = "One or more devices not found or not owned by partner" });

        var affiliatedTenantIds = await _context.PartnerClinicAffiliations
            .Where(a => a.PartnerId == partnerId && a.Status == AffiliationStatus.Active)
            .Select(a => a.TenantId)
            .ToListAsync(ct);

        var comparisons = new List<DeviceComparisonResult>();

        foreach (var device in devices)
        {
            var usages = await _context.PatientDeviceUsages
                .IgnoreQueryFilters()
                .Where(u => u.DeviceId == device.Id && affiliatedTenantIds.Contains(u.TenantId))
                .ToListAsync(ct);

            var patientCount = usages.Select(u => u.PatientId).Distinct().Count();

            if (patientCount < MinKAnonymity)
            {
                comparisons.Add(new DeviceComparisonResult
                {
                    DeviceId = device.Id,
                    DeviceName = device.Name,
                    PatientCount = patientCount,
                    SupressedDueToPrivacy = true
                });
                continue;
            }

            var usageIds = usages.Select(u => u.Id).ToList();
            var treatmentPlanIds = await _context.TreatmentPlans
                .IgnoreQueryFilters()
                .Where(tp => tp.LinkedDeviceUsageId != null && usageIds.Contains(tp.LinkedDeviceUsageId.Value))
                .Select(tp => tp.Id)
                .ToListAsync(ct);

            // Get PROM data for comparison metric
            var promQuery = _context.Set<PromInstance>()
                .IgnoreQueryFilters()
                .Include(p => p.Template)
                .Where(p => p.TreatmentPlanId != null && treatmentPlanIds.Contains(p.TreatmentPlanId.Value))
                .Where(p => p.Status == PromStatus.Completed && p.Score.HasValue);

            if (!string.IsNullOrEmpty(request.PromType))
            {
                promQuery = promQuery.Where(p => p.Template != null && p.Template.Key == request.PromType);
            }

            var promInstances = await promQuery.ToListAsync(ct);

            var baselineAvg = promInstances
                .Where(p => p.InstanceType == PromInstanceType.Baseline && p.Score.HasValue)
                .Select(p => p.Score!.Value)
                .DefaultIfEmpty(0)
                .Average();

            var followUpAvg = promInstances
                .Where(p => (p.InstanceType == PromInstanceType.FollowUp || p.InstanceType == PromInstanceType.FinalOutcome) && p.Score.HasValue)
                .Select(p => p.Score!.Value)
                .DefaultIfEmpty(0)
                .Average();

            comparisons.Add(new DeviceComparisonResult
            {
                DeviceId = device.Id,
                DeviceName = device.Name,
                DeviceCode = device.DeviceCode,
                Category = device.Category,
                PatientCount = patientCount,
                BaselineAverageScore = baselineAvg,
                FollowUpAverageScore = followUpAvg,
                AverageImprovement = baselineAvg - followUpAvg,
                PercentImprovement = baselineAvg > 0 ? ((baselineAvg - followUpAvg) / baselineAvg) * 100 : 0
            });
        }

        return Ok(new DeviceComparisonResponse
        {
            PromType = request.PromType ?? "All",
            Comparisons = comparisons
        });
    }

    private Guid? GetPartnerId()
    {
        // Partner ID should be in the JWT claims for partner users
        var partnerClaim = User.FindFirst("partner_id")?.Value
            ?? User.FindFirst("custom:partner_id")?.Value;
        return Guid.TryParse(partnerClaim, out var id) ? id : null;
    }
}

// Response DTOs
public class DeviceOutcomeSummaryResponse
{
    public Guid DeviceId { get; set; }
    public string DeviceName { get; set; } = string.Empty;
    public string DeviceCode { get; set; } = string.Empty;
    public string? PartnerName { get; set; }
    public string? Category { get; set; }
    public string? BodyRegion { get; set; }
    public int PatientCount { get; set; }
    public int ProcedureCount { get; set; }
    public int TreatmentPlanCount { get; set; }
    public int PromResponseCount { get; set; }
    public bool SupressedDueToPrivacy { get; set; }
    public string? Message { get; set; }
    public List<PromTypeOutcomeStats> PromTypeStats { get; set; } = new();
    public DateRangeInfo? DateRange { get; set; }
}

public class PromTypeOutcomeStats
{
    public string PromType { get; set; } = string.Empty;
    public string PromName { get; set; } = string.Empty;
    public int BaselineCount { get; set; }
    public decimal BaselineAverageScore { get; set; }
    public int FollowUpCount { get; set; }
    public decimal FollowUpAverageScore { get; set; }
    public int FinalOutcomeCount { get; set; }
    public decimal FinalOutcomeAverageScore { get; set; }
    public decimal AverageImprovement { get; set; }
    public decimal PercentImprovement { get; set; }
}

public class DateRangeInfo
{
    public DateTime EarliestProcedure { get; set; }
    public DateTime LatestProcedure { get; set; }
}

public class DeviceOutcomeTimelineResponse
{
    public Guid DeviceId { get; set; }
    public string DeviceName { get; set; } = string.Empty;
    public string PromType { get; set; } = string.Empty;
    public List<TimelineDataPoint> DataPoints { get; set; } = new();
}

public class TimelineDataPoint
{
    public int WeeksPostProcedure { get; set; }
    public int PatientCount { get; set; }
    public decimal AverageScore { get; set; }
    public decimal MinScore { get; set; }
    public decimal MaxScore { get; set; }
    public int ResponseCount { get; set; }
}

public class DeviceOutcomeBriefSummary
{
    public Guid DeviceId { get; set; }
    public string DeviceName { get; set; } = string.Empty;
    public string DeviceCode { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string? BodyRegion { get; set; }
    public int PatientCount { get; set; }
    public int ProcedureCount { get; set; }
    public bool HasSufficientData { get; set; }
}

public class CompareDevicesRequest
{
    public List<Guid>? DeviceIds { get; set; }
    public string? PromType { get; set; }
}

public class DeviceComparisonResponse
{
    public string PromType { get; set; } = string.Empty;
    public List<DeviceComparisonResult> Comparisons { get; set; } = new();
}

public class DeviceComparisonResult
{
    public Guid DeviceId { get; set; }
    public string DeviceName { get; set; } = string.Empty;
    public string? DeviceCode { get; set; }
    public string? Category { get; set; }
    public int PatientCount { get; set; }
    public bool SupressedDueToPrivacy { get; set; }
    public decimal BaselineAverageScore { get; set; }
    public decimal FollowUpAverageScore { get; set; }
    public decimal AverageImprovement { get; set; }
    public decimal PercentImprovement { get; set; }
}
