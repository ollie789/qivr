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

            // Parse time range
            var days = timeRange switch
            {
                "7days" => 7,
                "14days" => 14,
                "30days" => 30,
                "90days" => 90,
                _ => 30
            };

            var startDate = DateTime.UtcNow.AddDays(-days);

            // Get patient's vital signs (from PROM responses for now)
            // In a full implementation, this would query actual VitalSigns table
            var vitalSigns = new List<VitalSignRecord>();

            var metrics = new List<AnalyticsHealthMetricDto>();

            // Process blood pressure metrics
            // For now, use mock data - in production, query actual vitals
            if (false) // Temporarily disabled until VitalSigns table is added
            {
                var latestBP = vitalSigns.Where(v => v.SystolicBP.HasValue).LastOrDefault();
                var previousBP = vitalSigns.Where(v => v.SystolicBP.HasValue && v.Id != latestBP?.Id).LastOrDefault();
                
                if (latestBP != null)
                {
                    metrics.Add(new AnalyticsHealthMetricDto
                    {
                        Id = Guid.NewGuid().ToString(),
                        Category = "vitals",
                        Name = "Blood Pressure",
                        Value = latestBP.SystolicBP ?? 0,
                        Unit = "mmHg",
                        Date = latestBP.RecordedAt.ToString("yyyy-MM-dd"),
                        Trend = DetermineTrend(latestBP.SystolicBP ?? 0, previousBP?.SystolicBP ?? 0),
                        PercentageChange = CalculatePercentageChange(latestBP.SystolicBP ?? 0, previousBP?.SystolicBP ?? 0),
                        Status = DetermineBloodPressureStatus(latestBP.SystolicBP ?? 0),
                        Target = 120
                    });
                }
            }

            // Process heart rate metrics
            if (false) // Temporarily disabled until VitalSigns table is added
            {
                var latestHR = vitalSigns.Where(v => v.HeartRate.HasValue).LastOrDefault();
                var previousHR = vitalSigns.Where(v => v.HeartRate.HasValue && v.Id != latestHR?.Id).LastOrDefault();
                
                if (latestHR != null)
                {
                    metrics.Add(new AnalyticsHealthMetricDto
                    {
                        Id = Guid.NewGuid().ToString(),
                        Category = "vitals",
                        Name = "Heart Rate",
                        Value = latestHR.HeartRate ?? 0,
                        Unit = "bpm",
                        Date = latestHR.RecordedAt.ToString("yyyy-MM-dd"),
                        Trend = DetermineTrend(latestHR.HeartRate ?? 0, previousHR?.HeartRate ?? 0),
                        PercentageChange = CalculatePercentageChange(latestHR.HeartRate ?? 0, previousHR?.HeartRate ?? 0),
                        Status = DetermineHeartRateStatus(latestHR.HeartRate ?? 0),
                        Target = 70
                    });
                }
            }

            // Process weight metrics  
            if (false) // Temporarily disabled until VitalSigns table is added
            {
                var latestWeight = vitalSigns.Where(v => v.Weight.HasValue).LastOrDefault();
                var previousWeight = vitalSigns.Where(v => v.Weight.HasValue && v.Id != latestWeight?.Id).LastOrDefault();
                
                if (latestWeight != null)
                {
                    metrics.Add(new AnalyticsHealthMetricDto
                    {
                        Id = Guid.NewGuid().ToString(),
                        Category = "vitals",
                        Name = "Weight",
                        Value = (double)(latestWeight.Weight ?? 0),
                        Unit = "lbs",
                        Date = latestWeight.RecordedAt.ToString("yyyy-MM-dd"),
                        Trend = DetermineTrend((double)(latestWeight.Weight ?? 0), (double)(previousWeight?.Weight ?? 0)),
                        PercentageChange = CalculatePercentageChange((double)(latestWeight.Weight ?? 0), (double)(previousWeight?.Weight ?? 0)),
                        Status = "stable",
                        Target = null
                    });
                }
            }

            // Process BMI metrics
            if (false) // Temporarily disabled until VitalSigns table is added
            {
                var latestBMI = vitalSigns.Where(v => v.BMI.HasValue).LastOrDefault();
                
                if (latestBMI != null)
                {
                    metrics.Add(new AnalyticsHealthMetricDto
                    {
                        Id = Guid.NewGuid().ToString(),
                        Category = "vitals",
                        Name = "BMI",
                        Value = (double)(latestBMI.BMI ?? 0),
                        Unit = "kg/m²",
                        Date = latestBMI.RecordedAt.ToString("yyyy-MM-dd"),
                        Trend = "stable",
                        PercentageChange = 0,
                        Status = DetermineBMIStatus(latestBMI.BMI ?? 0),
                        Target = 22.5
                    });
                }
            }

            // Get PROM scores and add as health metrics
            var promResponses = await _context.PromResponses
                .Include(r => r.PromInstance)
                    .ThenInclude(i => i.Template)
                .Where(r => r.PromInstance.PatientId == userId && r.CreatedAt >= startDate)
                .OrderBy(r => r.CreatedAt)
                .ToListAsync();

            if (promResponses.Any())
            {
                var latestProm = promResponses.LastOrDefault();
                var previousProm = promResponses.Count > 1 ? promResponses[promResponses.Count - 2] : null;
                
                if (latestProm != null)
                {
                    metrics.Add(new AnalyticsHealthMetricDto
                    {
                        Id = Guid.NewGuid().ToString(),
                        Category = "prom",
                        Name = "Overall Health Score",
                        Value = (double)latestProm.Score,
                        Unit = "points",
                        Date = latestProm.CreatedAt.ToString("yyyy-MM-dd"),
                        Trend = DetermineTrend((double)latestProm.Score, (double)(previousProm?.Score ?? 0)),
                        PercentageChange = CalculatePercentageChange((double)latestProm.Score, (double)(previousProm?.Score ?? 0)),
                        Status = latestProm.Score > 70 ? "good" : (latestProm.Score > 40 ? "warning" : "critical"),
                        Target = 80
                    });
                }
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

            var days = timeRange switch
            {
                "7days" => 7,
                "14days" => 14,
                "30days" => 30,
                "90days" => 90,
                _ => 30
            };

            var startDate = DateTime.UtcNow.AddDays(-days);

            // Get PROM instances and responses
            var promData = await _context.PromInstances
                .Include(i => i.Template)
                .Include(i => i.Responses)
                .Where(i => i.PatientId == userId && i.CreatedAt >= startDate)
                .ToListAsync();

            var analytics = promData
                .GroupBy(i => i.Template?.Name ?? "Unknown")
                .Select(group => 
                {
                    var completedCount = group.Count(i => i.Status == PromStatus.Completed);
                    var totalCount = group.Count();
                    var responses = group.SelectMany(i => i.Responses).ToList();
                    
                    return new PROMAnalyticsDto
                    {
                        TemplateName = group.Key,
                        CompletionRate = totalCount > 0 ? (completedCount * 100.0 / totalCount) : 0,
                        AverageScore = responses.Any() ? (double)responses.Average(r => r.Score) : 0,
                        TrendData = responses
                            .OrderBy(r => r.CreatedAt)
                            .Select(r => new TrendDataPoint
                            {
                                Date = r.CreatedAt.ToString("yyyy-MM-dd"),
                                Score = (double)r.Score
                            })
                            .ToList(),
                        CategoryScores = CalculateCategoryScores(responses),
                        ResponseTime = responses.Any() && responses.All(r => r.PromInstance != null)
                            ? responses.Average(r => (r.CreatedAt - r.PromInstance!.CreatedAt).TotalMinutes)
                            : 0
                    };
                })
                .ToList();

            return Ok(analytics);
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

            // For now, return sample goals - in production, these would come from a Goals table
            var goals = new List<HealthGoalDto>
            {
                new HealthGoalDto
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = "Lower Blood Pressure",
                    Category = "vitals",
                    Target = 120,
                    Current = 125,
                    Unit = "mmHg",
                    Deadline = DateTime.UtcNow.AddMonths(2).ToString("yyyy-MM-dd"),
                    Progress = 75,
                    Status = "on-track"
                },
                new HealthGoalDto
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = "Increase Activity Level",
                    Category = "activity",
                    Target = 10000,
                    Current = 7500,
                    Unit = "steps/day",
                    Deadline = DateTime.UtcNow.AddMonths(1).ToString("yyyy-MM-dd"),
                    Progress = 75,
                    Status = "on-track"
                },
                new HealthGoalDto
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = "Improve PROM Score",
                    Category = "prom",
                    Target = 85,
                    Current = 72,
                    Unit = "points",
                    Deadline = DateTime.UtcNow.AddMonths(3).ToString("yyyy-MM-dd"),
                    Progress = 85,
                    Status = "behind"
                }
            };

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

            // Sample correlations - in production, this would use statistical analysis
            var correlations = new List<CorrelationDto>
            {
                new CorrelationDto
                {
                    Metric1 = "Blood Pressure",
                    Metric2 = "Activity Level",
                    Correlation = -0.72,
                    Significance = "high"
                },
                new CorrelationDto
                {
                    Metric1 = "Weight",
                    Metric2 = "BMI",
                    Correlation = 0.95,
                    Significance = "high"
                },
                new CorrelationDto
                {
                    Metric1 = "PROM Score",
                    Metric2 = "Activity Level",
                    Correlation = 0.68,
                    Significance = "medium"
                }
            };

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

            var startDate = DateTime.UtcNow.AddDays(-days);

            // For now, use empty list - in production, query actual VitalSigns table
            var vitalSigns = new List<VitalSignRecord>();

            var promResponses = await _context.PromResponses
                .Include(r => r.PromInstance)
                .Where(r => r.PromInstance.PatientId == userId && r.CreatedAt >= startDate)
                .OrderBy(r => r.CreatedAt)
                .ToListAsync();

            var trends = new PatientTrendsDto
            {
                VitalTrends = new List<VitalTrendPoint>(), // Empty for now
                PromTrends = promResponses.Select(r => new PromTrendPoint
                {
                    Date = r.CreatedAt.ToString("yyyy-MM-dd"),
                    Score = r.Score,
                    TemplateName = r.PromInstance.Template?.Name ?? "Unknown"
                }).ToList(),
                Summary = new TrendSummary
                {
                    TotalDataPoints = vitalSigns.Count + promResponses.Count(),
                    StartDate = startDate.ToString("yyyy-MM-dd"),
                    EndDate = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                    OverallTrend = "stable" // Would calculate based on actual data
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

    private string DetermineTrend(double current, double previous)
    {
        if (previous == 0) return "stable";
        var change = ((current - previous) / previous) * 100;
        
        if (change > 5) return "up";
        if (change < -5) return "down";
        return "stable";
    }

    private double CalculatePercentageChange(double current, double previous)
    {
        if (previous == 0) return 0;
        return Math.Round(((current - previous) / previous) * 100, 1);
    }

    private string DetermineBloodPressureStatus(int systolic)
    {
        if (systolic < 120) return "good";
        if (systolic < 140) return "warning";
        return "critical";
    }

    private string DetermineHeartRateStatus(int heartRate)
    {
        if (heartRate >= 60 && heartRate <= 100) return "good";
        if ((heartRate >= 50 && heartRate < 60) || (heartRate > 100 && heartRate <= 110)) return "warning";
        return "critical";
    }

    private string DetermineBMIStatus(decimal bmi)
    {
        if (bmi >= 18.5m && bmi < 25) return "good";
        if ((bmi >= 25 && bmi < 30) || (bmi >= 17 && bmi < 18.5m)) return "warning";
        return "critical";
    }

    private Dictionary<string, double> CalculateCategoryScores(List<PromResponse> responses)
    {
        // This would be more sophisticated in production, analyzing actual response categories
        var categories = new Dictionary<string, double>
        {
            { "Physical", responses.Any() ? (double)responses.Average(r => Math.Min(r.Score * 1.1m, 100)) : 0 },
            { "Mental", responses.Any() ? (double)responses.Average(r => Math.Min(r.Score * 0.95m, 100)) : 0 },
            { "Pain", responses.Any() ? (double)responses.Average(r => Math.Max(100 - r.Score, 0)) : 0 },
            { "Overall", responses.Any() ? (double)responses.Average(r => r.Score) : 0 }
        };
        
        return categories;
    }

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