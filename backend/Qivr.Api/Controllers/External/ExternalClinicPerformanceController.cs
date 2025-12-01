using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using Qivr.Services;

namespace Qivr.Api.Controllers.External;

/// <summary>
/// External API for clinic performance metrics.
/// Authenticated via API Key (X-API-Key header).
/// Used by third-party integrations to access clinic outcomes and benchmarks.
/// </summary>
[ApiController]
[Route("api/external")]
[Authorize(Policy = "ExternalApiRead")]
[Produces("application/json")]
[ApiExplorerSettings(GroupName = "external")]
public class ExternalClinicPerformanceController : ControllerBase
{
    private readonly QivrDbContext _context;
    private readonly IClinicAnalyticsService _analyticsService;
    private readonly ILogger<ExternalClinicPerformanceController> _logger;

    public ExternalClinicPerformanceController(
        QivrDbContext context,
        IClinicAnalyticsService analyticsService,
        ILogger<ExternalClinicPerformanceController> logger)
    {
        _context = context;
        _analyticsService = analyticsService;
        _logger = logger;
    }

    private Guid GetTenantId()
    {
        var tenantClaim = User.FindFirst("tenant_id")?.Value;
        return Guid.TryParse(tenantClaim, out var tenantId) ? tenantId : Guid.Empty;
    }

    /// <summary>
    /// Get clinic performance overview
    /// </summary>
    /// <remarks>
    /// Returns aggregated performance metrics for the clinic including:
    /// - Patient volumes
    /// - Appointment statistics
    /// - PROM completion rates
    /// - Treatment outcomes
    /// </remarks>
    [HttpGet("clinic-performance")]
    [ProducesResponseType(typeof(ClinicPerformanceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetClinicPerformance(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        CancellationToken ct = default)
    {
        var tenantId = GetTenantId();
        if (tenantId == Guid.Empty)
            return Unauthorized(new { error = "Invalid API key or tenant" });

        var start = startDate ?? DateTime.UtcNow.AddMonths(-3);
        var end = endDate ?? DateTime.UtcNow;

        _logger.LogInformation("External API: GetClinicPerformance for tenant {TenantId}, range {Start} to {End}",
            tenantId, start, end);

        // Get patient counts (users with role "Patient")
        var totalPatients = await _context.Users
            .CountAsync(u => u.TenantId == tenantId && u.DeletedAt == null &&
                            u.UserType == UserType.Patient, ct);

        var newPatientsInRange = await _context.Users
            .CountAsync(u => u.TenantId == tenantId && u.DeletedAt == null &&
                            u.UserType == UserType.Patient &&
                            u.CreatedAt >= start && u.CreatedAt <= end, ct);

        // Get appointment stats
        var appointmentsInRange = await _context.Appointments
            .Where(a => a.TenantId == tenantId &&
                       a.ScheduledStart >= start && a.ScheduledStart <= end)
            .GroupBy(a => 1)
            .Select(g => new
            {
                Total = g.Count(),
                Completed = g.Count(a => a.Status == AppointmentStatus.Completed),
                NoShows = g.Count(a => a.Status == AppointmentStatus.NoShow),
                Cancelled = g.Count(a => a.Status == AppointmentStatus.Cancelled)
            })
            .FirstOrDefaultAsync(ct);

        // Get PROM stats (CompletedAt having a non-default value means completed)
        var promStats = await _context.PromResponses
            .Where(r => r.TenantId == tenantId &&
                       r.CreatedAt >= start && r.CreatedAt <= end)
            .GroupBy(r => 1)
            .Select(g => new
            {
                TotalSent = g.Count(),
                Completed = g.Count(r => r.CompletedAt != default),
                AverageScore = (double?)g.Average(r => (double)r.Score)
            })
            .FirstOrDefaultAsync(ct);

        // Get treatment plan stats
        var treatmentStats = await _context.TreatmentPlans
            .Where(t => t.TenantId == tenantId && t.DeletedAt == null &&
                       t.CreatedAt >= start && t.CreatedAt <= end)
            .GroupBy(t => 1)
            .Select(g => new
            {
                TotalPlans = g.Count(),
                ActivePlans = g.Count(t => t.Status == TreatmentPlanStatus.Active),
                CompletedPlans = g.Count(t => t.Status == TreatmentPlanStatus.Completed),
                AverageProgress = (double?)g.Average(t => t.ProgressPercentage)
            })
            .FirstOrDefaultAsync(ct);

        var response = new ClinicPerformanceResponse
        {
            TenantId = tenantId,
            DateRange = new DateRangeDto { Start = start, End = end },
            PatientMetrics = new PatientMetricsDto
            {
                TotalPatients = totalPatients,
                NewPatientsInRange = newPatientsInRange
            },
            AppointmentMetrics = new AppointmentMetricsDto
            {
                TotalAppointments = appointmentsInRange?.Total ?? 0,
                CompletedAppointments = appointmentsInRange?.Completed ?? 0,
                NoShowCount = appointmentsInRange?.NoShows ?? 0,
                CancelledCount = appointmentsInRange?.Cancelled ?? 0,
                CompletionRate = appointmentsInRange?.Total > 0
                    ? Math.Round((double)(appointmentsInRange?.Completed ?? 0) / appointmentsInRange.Total * 100, 1)
                    : 0,
                NoShowRate = appointmentsInRange?.Total > 0
                    ? Math.Round((double)(appointmentsInRange?.NoShows ?? 0) / appointmentsInRange.Total * 100, 1)
                    : 0
            },
            PromMetrics = new PromMetricsDto
            {
                TotalSent = promStats?.TotalSent ?? 0,
                TotalCompleted = promStats?.Completed ?? 0,
                CompletionRate = promStats?.TotalSent > 0
                    ? Math.Round((double)(promStats?.Completed ?? 0) / promStats.TotalSent * 100, 1)
                    : 0,
                AverageScore = promStats?.AverageScore ?? 0
            },
            TreatmentPlanMetrics = new TreatmentPlanMetricsDto
            {
                TotalPlans = treatmentStats?.TotalPlans ?? 0,
                ActivePlans = treatmentStats?.ActivePlans ?? 0,
                CompletedPlans = treatmentStats?.CompletedPlans ?? 0,
                AverageProgress = Math.Round(treatmentStats?.AverageProgress ?? 0, 1)
            },
            GeneratedAt = DateTime.UtcNow
        };

        return Ok(response);
    }

    /// <summary>
    /// Get PROM outcome benchmarks
    /// </summary>
    /// <remarks>
    /// Returns aggregated PROM outcomes with before/after comparisons.
    /// Data is anonymized and aggregated to protect patient privacy.
    /// Minimum 5 patients per group for K-anonymity.
    /// </remarks>
    [HttpGet("prom-outcomes")]
    [ProducesResponseType(typeof(PromOutcomesResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPromOutcomes(
        [FromQuery] string? promType,
        [FromQuery] string? bodyRegion,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        CancellationToken ct = default)
    {
        var tenantId = GetTenantId();
        if (tenantId == Guid.Empty)
            return Unauthorized(new { error = "Invalid API key or tenant" });

        var start = startDate ?? DateTime.UtcNow.AddMonths(-6);
        var end = endDate ?? DateTime.UtcNow;

        _logger.LogInformation("External API: GetPromOutcomes for tenant {TenantId}", tenantId);

        // Get PROM responses with treatment context
        var query = _context.PromResponses
            .Where(r => r.TenantId == tenantId &&
                       r.CompletedAt != default &&
                       r.CreatedAt >= start && r.CreatedAt <= end);

        if (!string.IsNullOrEmpty(promType))
            query = query.Where(r => r.PromType == promType);

        var promData = await query
            .GroupBy(r => r.PromType)
            .Select(g => new PromTypeOutcome
            {
                PromType = g.Key ?? "Unknown",
                PatientCount = g.Select(r => r.PatientId).Distinct().Count(),
                ResponseCount = g.Count(),
                AverageScore = Math.Round((double)g.Average(r => r.Score), 1),
                MinScore = (double)g.Min(r => r.Score),
                MaxScore = (double)g.Max(r => r.Score),
                ScoreDistribution = new ScoreDistributionDto
                {
                    Minimal = g.Count(r => r.Severity == "Minimal"),
                    Mild = g.Count(r => r.Severity == "Mild"),
                    Moderate = g.Count(r => r.Severity == "Moderate"),
                    Severe = g.Count(r => r.Severity == "Severe")
                }
            })
            .Where(o => o.PatientCount >= 5) // K-anonymity: minimum 5 patients
            .ToListAsync(ct);

        // Get improvement data by comparing first and latest scores per patient
        // Note: Complex LINQ queries need to be done in memory for proper aggregation
        var allPromResponses = await _context.PromResponses
            .Where(r => r.TenantId == tenantId &&
                       r.CompletedAt != default &&
                       r.CreatedAt >= start && r.CreatedAt <= end)
            .Select(r => new { r.PatientId, r.PromType, r.Score, r.CreatedAt })
            .ToListAsync(ct);

        var improvementData = allPromResponses
            .GroupBy(r => new { r.PatientId, r.PromType })
            .Where(g => g.Count() >= 2)
            .Select(g => new
            {
                g.Key.PromType,
                FirstScore = g.OrderBy(r => r.CreatedAt).First().Score,
                LastScore = g.OrderByDescending(r => r.CreatedAt).First().Score
            })
            .ToList();

        var improvementByType = improvementData
            .GroupBy(d => d.PromType)
            .Select(g => new PromImprovementDto
            {
                PromType = g.Key ?? "Unknown",
                PatientsWithImprovement = g.Count(d => d.LastScore < d.FirstScore),
                TotalPatientsMeasured = g.Count(),
                AverageImprovement = g.Count() > 0
                    ? Math.Round((double)g.Average(d => d.FirstScore - d.LastScore), 1)
                    : 0,
                ImprovementRate = g.Count() > 0
                    ? Math.Round((double)g.Count(d => d.LastScore < d.FirstScore) / g.Count() * 100, 1)
                    : 0
            })
            .Where(i => i.TotalPatientsMeasured >= 5) // K-anonymity
            .ToList();

        var response = new PromOutcomesResponse
        {
            TenantId = tenantId,
            DateRange = new DateRangeDto { Start = start, End = end },
            OutcomesByType = promData,
            ImprovementMetrics = improvementByType,
            GeneratedAt = DateTime.UtcNow
        };

        return Ok(response);
    }

    /// <summary>
    /// Get treatment outcome statistics
    /// </summary>
    /// <remarks>
    /// Returns treatment plan completion rates and outcome metrics.
    /// Useful for quality reporting and benchmarking.
    /// </remarks>
    [HttpGet("treatment-outcomes")]
    [ProducesResponseType(typeof(TreatmentOutcomesResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTreatmentOutcomes(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        CancellationToken ct = default)
    {
        var tenantId = GetTenantId();
        if (tenantId == Guid.Empty)
            return Unauthorized(new { error = "Invalid API key or tenant" });

        var start = startDate ?? DateTime.UtcNow.AddMonths(-6);
        var end = endDate ?? DateTime.UtcNow;

        _logger.LogInformation("External API: GetTreatmentOutcomes for tenant {TenantId}", tenantId);

        // Get treatment plan completion stats
        var planStats = await _context.TreatmentPlans
            .Where(t => t.TenantId == tenantId && t.DeletedAt == null &&
                       t.CreatedAt >= start && t.CreatedAt <= end)
            .GroupBy(t => 1)
            .Select(g => new
            {
                Total = g.Count(),
                Completed = g.Count(t => t.Status == Core.Entities.TreatmentPlanStatus.Completed),
                Active = g.Count(t => t.Status == Core.Entities.TreatmentPlanStatus.Active),
                OnHold = g.Count(t => t.Status == Core.Entities.TreatmentPlanStatus.OnHold),
                Abandoned = g.Count(t => t.Status == Core.Entities.TreatmentPlanStatus.Cancelled),
                AverageDurationWeeks = g.Where(t => t.Status == Core.Entities.TreatmentPlanStatus.Completed)
                    .Average(t => (double?)t.DurationWeeks),
                AverageSessionsCompleted = g.Average(t => (double?)t.CompletedSessions),
                AverageProgress = g.Average(t => (double?)t.ProgressPercentage)
            })
            .FirstOrDefaultAsync(ct);

        // Get completion by plan duration
        var completionByDuration = await _context.TreatmentPlans
            .Where(t => t.TenantId == tenantId && t.DeletedAt == null &&
                       t.CreatedAt >= start && t.CreatedAt <= end)
            .GroupBy(t => t.DurationWeeks <= 4 ? "Short (1-4 weeks)" :
                         t.DurationWeeks <= 8 ? "Medium (5-8 weeks)" :
                         "Long (9+ weeks)")
            .Select(g => new DurationCompletionDto
            {
                Duration = g.Key,
                TotalPlans = g.Count(),
                CompletedPlans = g.Count(t => t.Status == Core.Entities.TreatmentPlanStatus.Completed),
                CompletionRate = g.Count() > 0
                    ? Math.Round((double)g.Count(t => t.Status == Core.Entities.TreatmentPlanStatus.Completed) / g.Count() * 100, 1)
                    : 0
            })
            .ToListAsync(ct);

        var response = new TreatmentOutcomesResponse
        {
            TenantId = tenantId,
            DateRange = new DateRangeDto { Start = start, End = end },
            Summary = new TreatmentSummaryDto
            {
                TotalPlans = planStats?.Total ?? 0,
                CompletedPlans = planStats?.Completed ?? 0,
                ActivePlans = planStats?.Active ?? 0,
                PausedPlans = planStats?.OnHold ?? 0,
                AbandonedPlans = planStats?.Abandoned ?? 0,
                CompletionRate = planStats?.Total > 0
                    ? Math.Round((double)(planStats?.Completed ?? 0) / planStats.Total * 100, 1)
                    : 0,
                AverageDurationWeeks = Math.Round(planStats?.AverageDurationWeeks ?? 0, 1),
                AverageSessionsCompleted = Math.Round(planStats?.AverageSessionsCompleted ?? 0, 1),
                AverageProgress = Math.Round(planStats?.AverageProgress ?? 0, 1)
            },
            CompletionByDuration = completionByDuration,
            GeneratedAt = DateTime.UtcNow
        };

        return Ok(response);
    }

    /// <summary>
    /// Get API health status
    /// </summary>
    [HttpGet("health")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(HealthCheckResponse), StatusCodes.Status200OK)]
    public IActionResult HealthCheck()
    {
        return Ok(new HealthCheckResponse
        {
            Status = "healthy",
            Version = "1.0.0",
            Timestamp = DateTime.UtcNow
        });
    }
}

#region Response DTOs

public class ClinicPerformanceResponse
{
    public Guid TenantId { get; set; }
    public DateRangeDto DateRange { get; set; } = new();
    public PatientMetricsDto PatientMetrics { get; set; } = new();
    public AppointmentMetricsDto AppointmentMetrics { get; set; } = new();
    public PromMetricsDto PromMetrics { get; set; } = new();
    public TreatmentPlanMetricsDto TreatmentPlanMetrics { get; set; } = new();
    public DateTime GeneratedAt { get; set; }
}

public class DateRangeDto
{
    public DateTime Start { get; set; }
    public DateTime End { get; set; }
}

public class PatientMetricsDto
{
    public int TotalPatients { get; set; }
    public int NewPatientsInRange { get; set; }
}

public class AppointmentMetricsDto
{
    public int TotalAppointments { get; set; }
    public int CompletedAppointments { get; set; }
    public int NoShowCount { get; set; }
    public int CancelledCount { get; set; }
    public double CompletionRate { get; set; }
    public double NoShowRate { get; set; }
}

public class PromMetricsDto
{
    public int TotalSent { get; set; }
    public int TotalCompleted { get; set; }
    public double CompletionRate { get; set; }
    public double AverageScore { get; set; }
}

public class TreatmentPlanMetricsDto
{
    public int TotalPlans { get; set; }
    public int ActivePlans { get; set; }
    public int CompletedPlans { get; set; }
    public double AverageProgress { get; set; }
}

public class PromOutcomesResponse
{
    public Guid TenantId { get; set; }
    public DateRangeDto DateRange { get; set; } = new();
    public List<PromTypeOutcome> OutcomesByType { get; set; } = new();
    public List<PromImprovementDto> ImprovementMetrics { get; set; } = new();
    public DateTime GeneratedAt { get; set; }
}

public class PromTypeOutcome
{
    public string PromType { get; set; } = string.Empty;
    public int PatientCount { get; set; }
    public int ResponseCount { get; set; }
    public double AverageScore { get; set; }
    public double MinScore { get; set; }
    public double MaxScore { get; set; }
    public ScoreDistributionDto ScoreDistribution { get; set; } = new();
}

public class ScoreDistributionDto
{
    public int Minimal { get; set; }
    public int Mild { get; set; }
    public int Moderate { get; set; }
    public int Severe { get; set; }
}

public class PromImprovementDto
{
    public string PromType { get; set; } = string.Empty;
    public int PatientsWithImprovement { get; set; }
    public int TotalPatientsMeasured { get; set; }
    public double AverageImprovement { get; set; }
    public double ImprovementRate { get; set; }
}

public class TreatmentOutcomesResponse
{
    public Guid TenantId { get; set; }
    public DateRangeDto DateRange { get; set; } = new();
    public TreatmentSummaryDto Summary { get; set; } = new();
    public List<DurationCompletionDto> CompletionByDuration { get; set; } = new();
    public DateTime GeneratedAt { get; set; }
}

public class TreatmentSummaryDto
{
    public int TotalPlans { get; set; }
    public int CompletedPlans { get; set; }
    public int ActivePlans { get; set; }
    public int PausedPlans { get; set; }
    public int AbandonedPlans { get; set; }
    public double CompletionRate { get; set; }
    public double AverageDurationWeeks { get; set; }
    public double AverageSessionsCompleted { get; set; }
    public double AverageProgress { get; set; }
}

public class DurationCompletionDto
{
    public string Duration { get; set; } = string.Empty;
    public int TotalPlans { get; set; }
    public int CompletedPlans { get; set; }
    public double CompletionRate { get; set; }
}

public class HealthCheckResponse
{
    public string Status { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}

#endregion
