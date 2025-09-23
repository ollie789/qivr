using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Qivr.Api.Services;
using Qivr.Infrastructure.Data;
using Qivr.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Qivr.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AnalyticsController : ControllerBase
{
    private readonly QivrDbContext _context;
    private readonly ILogger<AnalyticsController> _logger;
    private readonly IResourceAuthorizationService _authorizationService;

    public AnalyticsController(
        QivrDbContext context, 
        ILogger<AnalyticsController> logger,
        IResourceAuthorizationService authorizationService)
    {
        _context = context;
        _logger = logger;
        _authorizationService = authorizationService;
    }

    /// <summary>
    /// Get health metrics for a patient
    /// </summary>
    [HttpGet("health-metrics")]
    [ProducesResponseType(typeof(List<AnalyticsHealthMetricDto>), 200)]
    public async Task<IActionResult> GetHealthMetrics([FromQuery] string timeRange = "30days")
    {
        try
        {
            var userId = _authorizationService.GetCurrentUserId(User);
            if (userId == Guid.Empty)
            {
                return Unauthorized();
            }

            var days = ResolveTimeRangeDays(timeRange);
            var windowStart = DateTime.UtcNow.AddDays(-days);
            var previousStart = windowStart.AddDays(-days);

            var snapshot = await BuildPromSnapshot(userId, windowStart, previousStart);

            var metrics = new List<AnalyticsHealthMetricDto>();

            if (snapshot.LatestScore.HasValue)
            {
                var latest = (double)snapshot.LatestScore.Value;
                var previous = snapshot.PreviousScore.HasValue ? (double)snapshot.PreviousScore.Value : 0d;

                metrics.Add(new AnalyticsHealthMetricDto
                {
                    Id = Guid.NewGuid().ToString(),
                    Category = "prom",
                    Name = "Latest PROM Score",
                    Value = Math.Round(latest, 1),
                    Unit = "points",
                    Date = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                    Trend = DetermineTrend(latest, previous),
                    PercentageChange = CalculatePercentageChange(latest, previous),
                    Status = GetPromScoreStatus(latest),
                    Target = 80
                });
            }

            metrics.Add(new AnalyticsHealthMetricDto
            {
                Id = Guid.NewGuid().ToString(),
                Category = "prom",
                Name = "PROM Completion Rate",
                Value = snapshot.CompletionRate,
                Unit = "%",
                Date = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                Trend = DetermineTrend(snapshot.CompletionRate, snapshot.PreviousCompletionRate),
                PercentageChange = CalculatePercentageChange(snapshot.CompletionRate, snapshot.PreviousCompletionRate),
                Status = GetCompletionStatus(snapshot.CompletionRate),
                Target = 85
            });

            metrics.Add(new AnalyticsHealthMetricDto
            {
                Id = Guid.NewGuid().ToString(),
                Category = "prom",
                Name = "Pending PROMs",
                Value = snapshot.PendingCount,
                Unit = "count",
                Date = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                Trend = DetermineTrend(snapshot.PendingCount, snapshot.PreviousPendingCount),
                PercentageChange = CalculatePercentageChange(snapshot.PendingCount, snapshot.PreviousPendingCount),
                Status = GetPendingStatus(snapshot.PendingCount),
                Target = 0
            });

            var upcomingAppointments = await _context.Appointments
                .AsNoTracking()
                .Where(a => a.PatientId == userId && a.ScheduledStart >= DateTime.UtcNow &&
                            a.ScheduledStart < DateTime.UtcNow.AddDays(days) &&
                            a.Status != AppointmentStatus.Cancelled)
                .CountAsync();

            metrics.Add(new AnalyticsHealthMetricDto
            {
                Id = Guid.NewGuid().ToString(),
                Category = "appointments",
                Name = "Upcoming Appointments",
                Value = upcomingAppointments,
                Unit = "count",
                Date = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                Trend = "stable",
                PercentageChange = 0,
                Status = GetAppointmentsStatus(upcomingAppointments),
                Target = 1
            });

            if (snapshot.AverageResponseMinutes > 0)
            {
                metrics.Add(new AnalyticsHealthMetricDto
                {
                    Id = Guid.NewGuid().ToString(),
                    Category = "prom",
                    Name = "Average PROM Response Time",
                    Value = Math.Round(snapshot.AverageResponseMinutes, 1),
                    Unit = "minutes",
                    Date = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                    Trend = "stable",
                    PercentageChange = 0,
                    Status = snapshot.AverageResponseMinutes <= 60 ? "good" : (snapshot.AverageResponseMinutes <= 180 ? "warning" : "critical"),
                    Target = 60
                });
            }

            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting health metrics");
            return StatusCode(500, "An error occurred while retrieving health metrics");
        }
    }

    /// <summary>
    /// Get PROM analytics for a patient
    /// </summary>
    [HttpGet("prom-analytics")]
    [ProducesResponseType(typeof(List<PROMAnalyticsDto>), 200)]
    public async Task<IActionResult> GetPromAnalytics([FromQuery] string timeRange = "30days")
    {
        try
        {
            var userId = _authorizationService.GetCurrentUserId(User);
            if (userId == Guid.Empty)
            {
                return Unauthorized();
            }

            var days = ResolveTimeRangeDays(timeRange);
            var windowStart = DateTime.UtcNow.AddDays(-days);
            var previousStart = windowStart.AddDays(-days);

            var snapshot = await BuildPromSnapshot(userId, windowStart, previousStart);

            var templateGroups = snapshot.CurrentInstances
                .GroupBy(i => new { i.TemplateId, TemplateName = i.Template?.Name ?? "Unknown" })
                .ToList();

            var responseLookup = snapshot.CurrentResponses
                .GroupBy(tuple => new { tuple.Instance.TemplateId, TemplateName = tuple.Instance.Template?.Name ?? "Unknown" })
                .ToDictionary(g => g.Key, g => g.ToList());

            var analytics = new List<PROMAnalyticsDto>();

            foreach (var group in templateGroups)
            {
                responseLookup.TryGetValue(group.Key, out var responseTuples);
                responseTuples ??= new List<(PromInstance Instance, PromResponse Response)>();

                analytics.Add(BuildPromAnalyticsDto(group.Key.TemplateName, group.ToList(), responseTuples));
            }

            foreach (var kvp in responseLookup)
            {
                if (analytics.Any(a => a.TemplateName == kvp.Key.TemplateName))
                {
                    continue;
                }

                analytics.Add(BuildPromAnalyticsDto(kvp.Key.TemplateName, new List<PromInstance>(), kvp.Value));
            }

            return Ok(analytics
                .OrderByDescending(a => a.TrendData.Count)
                .ThenBy(a => a.TemplateName)
                .ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting PROM analytics");
            return StatusCode(500, "An error occurred while retrieving PROM analytics");
        }
    }

    /// <summary>
    /// Get patient health goals
    /// </summary>
    [HttpGet("health-goals")]
    [ProducesResponseType(typeof(List<HealthGoalDto>), 200)]
    public async Task<IActionResult> GetHealthGoals()
    {
        try
        {
            var userId = _authorizationService.GetCurrentUserId(User);
            if (userId == Guid.Empty)
            {
                return Unauthorized();
            }

            var windowStart = DateTime.UtcNow.AddDays(-ResolveTimeRangeDays("30days"));
            var previousStart = windowStart.AddDays(-ResolveTimeRangeDays("30days"));

            var snapshot = await BuildPromSnapshot(userId, windowStart, previousStart);

            var goals = new List<HealthGoalDto>
            {
                new HealthGoalDto
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = "Keep PROM completion above 85%",
                    Category = "prom",
                    Target = 85,
                    Current = Math.Round(snapshot.CompletionRate, 1),
                    Unit = "%",
                    Deadline = DateTime.UtcNow.AddMonths(1).ToString("yyyy-MM-dd"),
                    Progress = Math.Clamp(snapshot.CompletionRate, 0, 100),
                    Status = GetCompletionStatus(snapshot.CompletionRate)
                },
                new HealthGoalDto
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = "Improve average PROM score",
                    Category = "prom",
                    Target = 80,
                    Current = Math.Round(snapshot.AverageScore, 1),
                    Unit = "points",
                    Deadline = DateTime.UtcNow.AddMonths(2).ToString("yyyy-MM-dd"),
                    Progress = Math.Clamp(snapshot.AverageScore, 0, 100),
                    Status = GetPromScoreStatus(snapshot.AverageScore)
                },
                new HealthGoalDto
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = "Clear pending PROMs",
                    Category = "prom",
                    Target = 0,
                    Current = snapshot.PendingCount,
                    Unit = "count",
                    Deadline = DateTime.UtcNow.AddMonths(1).ToString("yyyy-MM-dd"),
                    Progress = snapshot.PendingCount == 0 ? 100 : Math.Clamp(100 - snapshot.PendingCount * 15, 0, 100),
                    Status = GetPendingStatus(snapshot.PendingCount)
                }
            };

            if (snapshot.AverageResponseMinutes > 0)
            {
                goals.Add(new HealthGoalDto
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = "Respond to PROMs within 60 minutes",
                    Category = "prom",
                    Target = 60,
                    Current = Math.Round(snapshot.AverageResponseMinutes, 1),
                    Unit = "minutes",
                    Deadline = DateTime.UtcNow.AddMonths(1).ToString("yyyy-MM-dd"),
                    Progress = Math.Clamp(100 - Math.Max(0, snapshot.AverageResponseMinutes - 60) * 2, 0, 100),
                    Status = snapshot.AverageResponseMinutes <= 60 ? "good" : (snapshot.AverageResponseMinutes <= 180 ? "warning" : "critical")
                });
            }

            return Ok(goals);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting health goals");
            return StatusCode(500, "An error occurred while retrieving health goals");
        }
    }

    /// <summary>
    /// Get health metric correlations
    /// </summary>
    [HttpGet("correlations")]
    [ProducesResponseType(typeof(List<CorrelationDto>), 200)]
    public async Task<IActionResult> GetCorrelations()
    {
        try
        {
            var userId = _authorizationService.GetCurrentUserId(User);
            if (userId == Guid.Empty)
            {
                return Unauthorized();
            }

            var windowStart = DateTime.UtcNow.AddDays(-ResolveTimeRangeDays("90days"));
            var previousStart = windowStart.AddDays(-ResolveTimeRangeDays("90days"));
            var snapshot = await BuildPromSnapshot(userId, windowStart, previousStart);

            var orderedResponses = snapshot.CurrentResponses
                .OrderBy(tuple => GetResponseTimestamp(tuple.Response))
                .ToList();

            var correlations = new List<CorrelationDto>();

            var scoreSeries = orderedResponses.Select(tuple => (double)tuple.Response.Score).ToList();
            var responseMinutes = orderedResponses
                .Select(tuple => Math.Max(0, (GetResponseTimestamp(tuple.Response) - GetScheduledTimestamp(tuple.Instance)).TotalMinutes))
                .ToList();

            var correlation = CalculateCorrelation(scoreSeries, responseMinutes);
            if (correlation.HasValue)
            {
                correlations.Add(new CorrelationDto
                {
                    Metric1 = "PROM Score",
                    Metric2 = "Response Time (minutes)",
                    Correlation = correlation.Value,
                    Significance = DescribeSignificance(correlation.Value)
                });
            }

            if (orderedResponses.Count > 1)
            {
                var gapScores = new List<double>();
                var gapDays = new List<double>();
                for (var i = 1; i < orderedResponses.Count; i++)
                {
                    var previous = GetResponseTimestamp(orderedResponses[i - 1].Response);
                    var current = GetResponseTimestamp(orderedResponses[i].Response);
                    var gap = (current - previous).TotalDays;
                    if (gap >= 0)
                    {
                        gapDays.Add(gap);
                        gapScores.Add((double)orderedResponses[i].Response.Score);
                    }
                }

                var cadenceCorrelation = CalculateCorrelation(gapScores, gapDays);
                if (cadenceCorrelation.HasValue)
                {
                    correlations.Add(new CorrelationDto
                    {
                        Metric1 = "PROM Score",
                        Metric2 = "Days Since Previous PROM",
                        Correlation = cadenceCorrelation.Value,
                        Significance = DescribeSignificance(cadenceCorrelation.Value)
                    });
                }
            }

            return Ok(correlations);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting correlations");
            return StatusCode(500, "An error occurred while retrieving correlations");
        }
    }

    /// <summary>
    /// Get patient trends over time
    /// </summary>
    [HttpGet("patient-trends")]
    [ProducesResponseType(typeof(PatientTrendsDto), 200)]
    public async Task<IActionResult> GetPatientTrends([FromQuery] int days = 30)
    {
        try
        {
            var userId = _authorizationService.GetCurrentUserId(User);
            if (userId == Guid.Empty)
            {
                return Unauthorized();
            }

            var windowStart = DateTime.UtcNow.AddDays(-Math.Max(1, days));
            var previousStart = windowStart.AddDays(-Math.Max(1, days));
            var snapshot = await BuildPromSnapshot(userId, windowStart, previousStart);

            var promTrendPoints = snapshot.CurrentResponses
                .OrderBy(tuple => GetResponseTimestamp(tuple.Response))
                .Select(tuple => new PromTrendPoint
                {
                    Date = GetResponseTimestamp(tuple.Response).ToString("yyyy-MM-dd"),
                    Score = tuple.Response.Score,
                    TemplateName = tuple.Instance.Template?.Name ?? "Unknown"
                })
                .ToList();

            var trends = new PatientTrendsDto
            {
                VitalTrends = new List<VitalTrendPoint>(),
                PromTrends = promTrendPoints,
                Summary = new TrendSummary
                {
                    TotalDataPoints = promTrendPoints.Count,
                    StartDate = promTrendPoints.FirstOrDefault()?.Date ?? string.Empty,
                    EndDate = promTrendPoints.LastOrDefault()?.Date ?? string.Empty,
                    OverallTrend = DetermineOverallTrend(promTrendPoints)
                }
            };

            return Ok(trends);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting patient trends");
            return StatusCode(500, "An error occurred while retrieving patient trends");
        }
    }

    #region Helper Methods

    private static int ResolveTimeRangeDays(string timeRange)
    {
        if (string.IsNullOrWhiteSpace(timeRange))
        {
            return 30;
        }

        var normalized = timeRange.Trim().ToLowerInvariant();
        return normalized switch
        {
            "7" or "7days" => 7,
            "14" or "14days" => 14,
            "90" or "90days" => 90,
            _ => 30
        };
    }

    private string DetermineTrend(double current, double previous)
    {
        if (Math.Abs(previous) < double.Epsilon)
        {
            if (Math.Abs(current) < double.Epsilon)
            {
                return "stable";
            }

            return current > 0 ? "up" : "down";
        }

        var change = ((current - previous) / previous) * 100;

        if (change > 5) return "up";
        if (change < -5) return "down";
        return "stable";
    }

    private double CalculatePercentageChange(double current, double previous)
    {
        if (Math.Abs(previous) < double.Epsilon)
        {
            return Math.Abs(current) < double.Epsilon ? 0 : 100;
        }

        return Math.Round(((current - previous) / previous) * 100, 1);
    }

    private static string GetPromScoreStatus(double score)
    {
        if (score >= 80) return "good";
        if (score >= 50) return "warning";
        return "critical";
    }

    private static string GetCompletionStatus(double rate)
    {
        if (rate >= 85) return "good";
        if (rate >= 60) return "warning";
        return "critical";
    }

    private static string GetPendingStatus(int pendingCount)
    {
        if (pendingCount == 0) return "good";
        if (pendingCount <= 3) return "warning";
        return "critical";
    }

    private static string GetAppointmentsStatus(int upcoming)
    {
        return upcoming > 0 ? "good" : "warning";
    }

    private PROMAnalyticsDto BuildPromAnalyticsDto(string templateName, IReadOnlyCollection<PromInstance> instances, IReadOnlyCollection<(PromInstance Instance, PromResponse Response)> responses)
    {
        var completionRate = CalculateCompletionRate(instances);

        var trendData = responses
            .OrderBy(tuple => GetResponseTimestamp(tuple.Response))
            .Select(tuple => new TrendDataPoint
            {
                Date = GetResponseTimestamp(tuple.Response).ToString("yyyy-MM-dd"),
                Score = Math.Round((double)tuple.Response.Score, 2)
            })
            .ToList();

        var averageScore = responses.Any()
            ? Math.Round(responses.Average(tuple => (double)tuple.Response.Score), 2)
            : 0d;

        var responseMinutes = responses
            .Select(tuple => (GetResponseTimestamp(tuple.Response) - GetScheduledTimestamp(tuple.Instance)).TotalMinutes)
            .Where(minutes => minutes >= 0)
            .ToList();

        var responseTime = responseMinutes.Count > 0
            ? Math.Round(responseMinutes.Average(), 1)
            : 0d;

        var categoryScores = CalculateCategoryScores(responses);

        return new PROMAnalyticsDto
        {
            TemplateName = templateName,
            CompletionRate = completionRate,
            AverageScore = averageScore,
            TrendData = trendData,
            CategoryScores = categoryScores,
            ResponseTime = responseTime
        };
    }

    private static Dictionary<string, double> CalculateCategoryScores(IReadOnlyCollection<(PromInstance Instance, PromResponse Response)> responses)
    {
        if (responses.Count == 0)
        {
            return new Dictionary<string, double>();
        }

        if (responses.Any(r => !string.IsNullOrWhiteSpace(r.Response.Severity)))
        {
            return responses
                .GroupBy(r => string.IsNullOrWhiteSpace(r.Response.Severity) ? "Unknown" : r.Response.Severity)
                .ToDictionary(g => g.Key, g => Math.Round(g.Average(x => (double)x.Response.Score), 2));
        }

        return new Dictionary<string, double>
        {
            { "Average", Math.Round(responses.Average(r => (double)r.Response.Score), 2) }
        };
    }

    private static double? CalculateCorrelation(IReadOnlyList<double> seriesA, IReadOnlyList<double> seriesB)
    {
        if (seriesA.Count != seriesB.Count || seriesA.Count < 2)
        {
            return null;
        }

        var meanA = seriesA.Average();
        var meanB = seriesB.Average();

        double numerator = 0;
        double sumSqA = 0;
        double sumSqB = 0;

        for (var i = 0; i < seriesA.Count; i++)
        {
            var deltaA = seriesA[i] - meanA;
            var deltaB = seriesB[i] - meanB;
            numerator += deltaA * deltaB;
            sumSqA += deltaA * deltaA;
            sumSqB += deltaB * deltaB;
        }

        var denominator = Math.Sqrt(sumSqA * sumSqB);
        if (Math.Abs(denominator) < double.Epsilon)
        {
            return null;
        }

        return Math.Round(numerator / denominator, 4);
    }

    private static string DescribeSignificance(double correlation)
    {
        var magnitude = Math.Abs(correlation);
        if (magnitude >= 0.7) return "high";
        if (magnitude >= 0.4) return "medium";
        return "low";
    }

    private static string DetermineOverallTrend(IReadOnlyList<PromTrendPoint> points)
    {
        if (points.Count < 2)
        {
            return "stable";
        }

        var first = (double)points.First().Score;
        var last = (double)points.Last().Score;
        var delta = last - first;

        if (delta > 2) return "up";
        if (delta < -2) return "down";
        return "stable";
    }

    private async Task<PromSnapshot> BuildPromSnapshot(Guid patientId, DateTime windowStart, DateTime previousWindowStart)
    {
        var instances = await _context.PromInstances
            .AsNoTracking()
            .Include(i => i.Template)
            .Include(i => i.Responses)
            .Where(i => i.PatientId == patientId &&
                        (i.ScheduledFor >= previousWindowStart ||
                         (i.ScheduledFor == default && i.CreatedAt >= previousWindowStart)))
            .ToListAsync();

        var currentInstances = instances
            .Where(i => GetScheduledTimestamp(i) >= windowStart)
            .ToList();

        var previousInstances = instances
            .Where(i =>
            {
                var scheduled = GetScheduledTimestamp(i);
                return scheduled >= previousWindowStart && scheduled < windowStart;
            })
            .ToList();

        var currentResponses = currentInstances
            .SelectMany(i => i.Responses.Select(r => (Instance: i, Response: r)))
            .Where(tuple => GetResponseTimestamp(tuple.Response) >= windowStart)
            .OrderBy(tuple => GetResponseTimestamp(tuple.Response))
            .ToList();

        var previousResponses = previousInstances
            .SelectMany(i => i.Responses.Select(r => (Instance: i, Response: r)))
            .Where(tuple =>
            {
                var timestamp = GetResponseTimestamp(tuple.Response);
                return timestamp >= previousWindowStart && timestamp < windowStart;
            })
            .OrderBy(tuple => GetResponseTimestamp(tuple.Response))
            .ToList();

        decimal? latestScore = currentResponses.LastOrDefault().Response?.Score;

        decimal? previousScore = null;
        if (currentResponses.Count > 1)
        {
            previousScore = currentResponses[^2].Response.Score;
        }
        else if (previousResponses.Count > 0)
        {
            previousScore = previousResponses.Last().Response.Score;
        }

        var averageScore = currentResponses.Any()
            ? currentResponses.Average(tuple => (double)tuple.Response.Score)
            : 0d;

        var responseMinutes = currentResponses
            .Select(tuple => (GetResponseTimestamp(tuple.Response) - GetScheduledTimestamp(tuple.Instance)).TotalMinutes)
            .Where(minutes => minutes >= 0)
            .ToList();

        var averageResponseMinutes = responseMinutes.Count > 0 ? responseMinutes.Average() : 0d;

        var completionRate = CalculateCompletionRate(currentInstances);
        var previousCompletionRate = CalculateCompletionRate(previousInstances);

        var pendingCount = currentInstances.Count(i => i.Status == PromStatus.Pending);
        var previousPendingCount = previousInstances.Count(i => i.Status == PromStatus.Pending);
        var completedCount = currentInstances.Count(i => i.Status == PromStatus.Completed);

        return new PromSnapshot(
            currentInstances,
            previousInstances,
            currentResponses,
            previousResponses,
            completionRate,
            previousCompletionRate,
            pendingCount,
            previousPendingCount,
            completedCount,
            latestScore,
            previousScore,
            averageScore,
            averageResponseMinutes);
    }

    private static double CalculateCompletionRate(IReadOnlyCollection<PromInstance> instances)
    {
        if (instances.Count == 0)
        {
            return 0;
        }

        var completed = instances.Count(i => i.Status == PromStatus.Completed);
        return Math.Round(completed * 100d / instances.Count, 1);
    }

    private static DateTime GetResponseTimestamp(PromResponse response)
    {
        return response.CompletedAt != default ? response.CompletedAt : response.CreatedAt;
    }

    private static DateTime GetScheduledTimestamp(PromInstance instance)
    {
        return instance.ScheduledFor != default ? instance.ScheduledFor : instance.CreatedAt;
    }

    private sealed record PromSnapshot(
        IReadOnlyList<PromInstance> CurrentInstances,
        IReadOnlyList<PromInstance> PreviousInstances,
        IReadOnlyList<(PromInstance Instance, PromResponse Response)> CurrentResponses,
        IReadOnlyList<(PromInstance Instance, PromResponse Response)> PreviousResponses,
        double CompletionRate,
        double PreviousCompletionRate,
        int PendingCount,
        int PreviousPendingCount,
        int CompletedCount,
        decimal? LatestScore,
        decimal? PreviousScore,
        double AverageScore,
        double AverageResponseMinutes);

    #endregion
}

#region DTOs

// Temporary class until VitalSigns table is implemented
public class VitalSignRecord
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public DateTime RecordedAt { get; set; }
    public int? SystolicBP { get; set; }
    public int? DiastolicBP { get; set; }
    public int? HeartRate { get; set; }
    public decimal? Weight { get; set; }
    public decimal? Temperature { get; set; }
    public decimal? BMI { get; set; }
    public int? OxygenSaturation { get; set; }
}

public class AnalyticsHealthMetricDto
{
    public string Id { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public double Value { get; set; }
    public string Unit { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string Trend { get; set; } = string.Empty;
    public double PercentageChange { get; set; }
    public string Status { get; set; } = string.Empty;
    public double? Target { get; set; }
}

public class PROMAnalyticsDto
{
    public string TemplateName { get; set; } = string.Empty;
    public double CompletionRate { get; set; }
    public double AverageScore { get; set; }
    public List<TrendDataPoint> TrendData { get; set; } = new();
    public Dictionary<string, double> CategoryScores { get; set; } = new();
    public double ResponseTime { get; set; }
}

public class TrendDataPoint
{
    public string Date { get; set; } = string.Empty;
    public double Score { get; set; }
}

public class HealthGoalDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public double Target { get; set; }
    public double Current { get; set; }
    public string Unit { get; set; } = string.Empty;
    public string Deadline { get; set; } = string.Empty;
    public double Progress { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class CorrelationDto
{
    public string Metric1 { get; set; } = string.Empty;
    public string Metric2 { get; set; } = string.Empty;
    public double Correlation { get; set; }
    public string Significance { get; set; } = string.Empty;
}

public class PatientTrendsDto
{
    public List<VitalTrendPoint> VitalTrends { get; set; } = new();
    public List<PromTrendPoint> PromTrends { get; set; } = new();
    public TrendSummary Summary { get; set; } = new();
}

public class VitalTrendPoint
{
    public string Date { get; set; } = string.Empty;
    public int? BloodPressureSystolic { get; set; }
    public int? BloodPressureDiastolic { get; set; }
    public int? HeartRate { get; set; }
    public decimal? Weight { get; set; }
    public decimal? Temperature { get; set; }
    public int? OxygenSaturation { get; set; }
}

public class PromTrendPoint
{
    public string Date { get; set; } = string.Empty;
    public decimal Score { get; set; }
    public string TemplateName { get; set; } = string.Empty;
}

public class TrendSummary
{
    public int TotalDataPoints { get; set; }
    public string StartDate { get; set; } = string.Empty;
    public string EndDate { get; set; } = string.Empty;
    public string OverallTrend { get; set; } = string.Empty;
}

#endregion