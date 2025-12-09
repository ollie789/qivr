using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;
using Qivr.Services;

namespace Qivr.Api.Controllers;

/// <summary>
/// Clinic Analytics API - powers the staff dashboard.
/// Matches the frontend AnalyticsData type expected by useAnalyticsDashboardData.ts
/// </summary>
[ApiController]
[Route("api/clinic-analytics")]
[Authorize(Policy = "StaffOnly")]
public class ClinicAnalyticsController : BaseApiController
{
    private readonly IClinicAnalyticsService _analyticsService;
    private readonly QivrDbContext _db;
    private readonly ILogger<ClinicAnalyticsController> _logger;

    public ClinicAnalyticsController(
        IClinicAnalyticsService analyticsService,
        QivrDbContext db,
        ILogger<ClinicAnalyticsController> logger)
    {
        _analyticsService = analyticsService;
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Get dashboard metrics for today
    /// </summary>
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(DashboardMetrics), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboardMetrics(
        [FromQuery] DateTime? date,
        CancellationToken cancellationToken)
    {
        var tenantId = RequireTenantId();
        var targetDate = date.HasValue
            ? DateTime.SpecifyKind(date.Value, DateTimeKind.Utc)
            : DateTime.UtcNow;

        var metrics = await _analyticsService.GetDashboardMetricsAsync(tenantId, targetDate, cancellationToken);
        return Ok(metrics);
    }

    /// <summary>
    /// Get unified analytics data matching frontend AnalyticsData type.
    /// This endpoint aggregates healthMetrics, promAnalytics, healthGoals, and correlations.
    /// </summary>
    [HttpGet("unified")]
    [ProducesResponseType(typeof(UnifiedAnalyticsData), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUnifiedAnalytics(
        [FromQuery] int days = 30,
        CancellationToken cancellationToken = default)
    {
        var tenantId = RequireTenantId();
        var since = DateTime.UtcNow.AddDays(-days);

        // 1. Health Metrics - Aggregated Pain Scores by day (DB-side aggregation)
        var healthMetrics = await _db.PainMaps
            .Where(p => p.TenantId == tenantId && p.CreatedAt >= since)
            .GroupBy(p => p.CreatedAt.Date)
            .Select(g => new ClinicHealthMetric
            {
                Id = g.Key.ToString("yyyy-MM-dd"),
                Category = "Pain",
                Name = "Average Pain Intensity",
                Value = g.Average(p => p.PainIntensity),
                Unit = "0-10",
                Date = g.Key,
                Trend = "stable", // Will be calculated below
                PercentageChange = 0,
                Status = g.Average(p => p.PainIntensity) > 7 ? "critical" :
                         g.Average(p => p.PainIntensity) > 4 ? "warning" : "good"
            })
            .OrderBy(m => m.Date)
            .ToListAsync(cancellationToken);

        // Calculate trends for pain metrics
        for (int i = 1; i < healthMetrics.Count; i++)
        {
            var prev = healthMetrics[i - 1].Value;
            var curr = healthMetrics[i].Value;
            if (prev > 0)
            {
                var change = (curr - prev) / prev * 100;
                healthMetrics[i].PercentageChange = (decimal)change;
                healthMetrics[i].Trend = change > 5 ? "up" : change < -5 ? "down" : "stable";
            }
        }

        // 2. PROM Analytics - Completion rates and average scores (DB-side aggregation)
        var promAnalytics = await _db.PromInstances
            .Where(p => p.TenantId == tenantId && p.CreatedAt >= since)
            .GroupBy(p => p.Template!.Name)
            .Select(g => new ClinicPromAnalytics
            {
                TemplateName = g.Key ?? "Unknown",
                TotalCount = g.Count(),
                CompletedCount = g.Count(p => p.Status == PromStatus.Completed),
                CompletionRate = g.Count() > 0
                    ? (decimal)g.Count(p => p.Status == PromStatus.Completed) / g.Count() * 100
                    : 0,
                AverageScore = g.Where(p => p.Score.HasValue).Average(p => (double?)p.Score) ?? 0
            })
            .ToListAsync(cancellationToken);

        // 3. Correlations - Use raw SQL for CORR() function (Postgres native)
        // This is MUCH faster than doing Pearson correlation in C#
        var correlations = new List<ClinicMetricCorrelation>();
        try
        {
            // Pain vs PROM Score correlation using Postgres CORR() function
            var correlationResult = await _db.Database
                .SqlQuery<CorrelationResult>($@"
                    SELECT
                        'Pain Intensity' as metric1,
                        'PROM Score' as metric2,
                        COALESCE(CORR(pm.pain_intensity, pi.score), 0) as coefficient
                    FROM qivr.pain_maps pm
                    INNER JOIN qivr.prom_instances pi ON pm.patient_id = pi.patient_id
                        AND DATE(pm.created_at) = DATE(pi.completed_at)
                    WHERE pm.tenant_id = {tenantId}
                        AND pm.created_at >= {since}
                        AND pi.score IS NOT NULL
                ")
                .ToListAsync(cancellationToken);

            foreach (var corr in correlationResult)
            {
                var significance = Math.Abs(corr.Coefficient) > 0.7 ? "high" :
                                   Math.Abs(corr.Coefficient) > 0.4 ? "medium" : "low";
                correlations.Add(new ClinicMetricCorrelation
                {
                    Metric1 = corr.Metric1,
                    Metric2 = corr.Metric2,
                    Correlation = corr.Coefficient,
                    Significance = significance
                });
            }
        }
        catch (Exception ex)
        {
            // Correlation query may fail if tables are empty or schema differs
            _logger.LogWarning(ex, "Failed to calculate correlations, returning empty set");
        }

        // 4. Health Goals - Placeholder (implement goal tracking later)
        var healthGoals = new List<ClinicHealthGoal>();

        return Ok(new UnifiedAnalyticsData
        {
            HealthMetrics = healthMetrics,
            PromAnalytics = promAnalytics,
            HealthGoals = healthGoals,
            Correlations = correlations,
            Loading = false
        });
    }

    /// <summary>
    /// Get clinical analytics for date range
    /// </summary>
    [HttpGet("clinical")]
    [ProducesResponseType(typeof(ClinicalAnalytics), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetClinicalAnalytics(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        CancellationToken cancellationToken)
    {
        var tenantId = RequireTenantId();
        var fromDate = from.HasValue
            ? DateTime.SpecifyKind(from.Value, DateTimeKind.Utc)
            : DateTime.UtcNow.AddDays(-30);
        var toDate = to.HasValue
            ? DateTime.SpecifyKind(to.Value, DateTimeKind.Utc)
            : DateTime.UtcNow;

        var analytics = await _analyticsService.GetClinicalAnalyticsAsync(tenantId, fromDate, toDate, cancellationToken);
        return Ok(analytics);
    }

    /// <summary>
    /// Get 3D pain map analytics
    /// </summary>
    [HttpGet("pain-maps")]
    [ProducesResponseType(typeof(PainMapAnalytics), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPainMapAnalytics(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        CancellationToken cancellationToken)
    {
        var tenantId = RequireTenantId();
        var fromDate = from ?? DateTime.UtcNow.AddDays(-30);
        var toDate = to ?? DateTime.UtcNow;

        var analytics = await _analyticsService.GetPainMapAnalyticsAsync(tenantId, fromDate, toDate, cancellationToken);
        return Ok(analytics);
    }

    /// <summary>
    /// Get enhanced PROM analytics using normalized infrastructure.
    /// Provides subscale breakdowns, instrument-based filtering, MCID tracking, and item-level analytics.
    /// </summary>
    [HttpGet("proms")]
    [ProducesResponseType(typeof(PromAnalyticsSummary), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPromAnalytics(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] string? instrumentKey,
        [FromQuery] string? clinicalDomain,
        CancellationToken cancellationToken)
    {
        var tenantId = RequireTenantId();
        var fromDate = from.HasValue
            ? DateTime.SpecifyKind(from.Value, DateTimeKind.Utc)
            : DateTime.UtcNow.AddDays(-30);
        var toDate = to.HasValue
            ? DateTime.SpecifyKind(to.Value, DateTimeKind.Utc)
            : DateTime.UtcNow;

        var analytics = await _analyticsService.GetPromAnalyticsAsync(
            tenantId, fromDate, toDate, instrumentKey, clinicalDomain, cancellationToken);
        return Ok(analytics);
    }
}

// DTOs matching frontend AnalyticsData type
public class UnifiedAnalyticsData
{
    public List<ClinicHealthMetric> HealthMetrics { get; set; } = new();
    public List<ClinicPromAnalytics> PromAnalytics { get; set; } = new();
    public List<ClinicHealthGoal> HealthGoals { get; set; } = new();
    public List<ClinicMetricCorrelation> Correlations { get; set; } = new();
    public bool Loading { get; set; }
}

public class ClinicHealthMetric
{
    public string Id { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public double Value { get; set; }
    public string Unit { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string Trend { get; set; } = "stable"; // "up", "down", "stable"
    public decimal PercentageChange { get; set; }
    public string Status { get; set; } = "good"; // "good", "warning", "critical"
    public double? Target { get; set; }
}

public class ClinicPromAnalytics
{
    public string TemplateName { get; set; } = string.Empty;
    public int TotalCount { get; set; }
    public int CompletedCount { get; set; }
    public decimal CompletionRate { get; set; }
    public double AverageScore { get; set; }
}

public class ClinicHealthGoal
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public double Target { get; set; }
    public double Current { get; set; }
    public string Unit { get; set; } = string.Empty;
    public DateTime Deadline { get; set; }
    public double Progress { get; set; }
    public string Status { get; set; } = "on-track"; // "on-track", "behind", "achieved"
}

public class ClinicMetricCorrelation
{
    public string Metric1 { get; set; } = string.Empty;
    public string Metric2 { get; set; } = string.Empty;
    public double Correlation { get; set; }
    public string Significance { get; set; } = "low"; // "high", "medium", "low"
}

// Helper for raw SQL correlation query
public class CorrelationResult
{
    public string Metric1 { get; set; } = string.Empty;
    public string Metric2 { get; set; } = string.Empty;
    public double Coefficient { get; set; }
}
