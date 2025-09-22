using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Services.Clinical;

/// <summary>
/// Service for tracking Minimal Clinically Important Difference (MCID) in patient outcomes
/// </summary>
public interface IMcidTrackingService
{
    Task<McidAnalysis> AnalyzePromProgress(Guid patientId, string promTemplateKey);
    Task<List<McidThreshold>> GetMcidThresholds(string promTemplateKey);
    Task UpdateMcidThreshold(string promTemplateKey, string measureType, decimal threshold);
    Task<bool> HasAchievedMcid(Guid patientId, string promTemplateKey, DateTime? fromDate = null);
    Task<McidReport> GenerateMcidReport(Guid clinicId, DateTime startDate, DateTime endDate);
}

public class McidTrackingService : IMcidTrackingService
{
    private readonly QivrDbContext _dbContext;
    private readonly ILogger<McidTrackingService> _logger;
    
    // Default MCID thresholds for common PROM types (can be overridden per clinic)
    private static readonly Dictionary<string, Dictionary<string, decimal>> DefaultMcidThresholds = new()
    {
        ["ODI"] = new() { ["improvement"] = 10m, ["deterioration"] = -10m }, // Oswestry Disability Index
        ["NPRS"] = new() { ["improvement"] = 2m, ["deterioration"] = -2m },  // Numeric Pain Rating Scale
        ["DASH"] = new() { ["improvement"] = 10.2m, ["deterioration"] = -10.2m }, // Disabilities of Arm, Shoulder, Hand
        ["KOOS"] = new() { ["improvement"] = 8m, ["deterioration"] = -8m }, // Knee Injury and Osteoarthritis Outcome Score
        ["HOOS"] = new() { ["improvement"] = 8m, ["deterioration"] = -8m }, // Hip Disability and Osteoarthritis Outcome Score
        ["NDI"] = new() { ["improvement"] = 5m, ["deterioration"] = -5m },  // Neck Disability Index
        ["RMDQ"] = new() { ["improvement"] = 2m, ["deterioration"] = -2m }, // Roland-Morris Disability Questionnaire
        ["SF36"] = new() { ["improvement"] = 5m, ["deterioration"] = -5m }, // Short Form 36
        ["PROMIS"] = new() { ["improvement"] = 3m, ["deterioration"] = -3m }, // PROMIS scales (T-score)
        ["VAS"] = new() { ["improvement"] = 1.5m, ["deterioration"] = -1.5m }, // Visual Analog Scale
    };

    public McidTrackingService(QivrDbContext dbContext, ILogger<McidTrackingService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<McidAnalysis> AnalyzePromProgress(Guid patientId, string promTemplateKey)
    {
        var analysis = new McidAnalysis
        {
            PatientId = patientId,
            PromTemplateKey = promTemplateKey,
            AnalysisDate = DateTime.UtcNow
        };

        // Get all completed PROM instances for this patient and template
        var instances = await _dbContext.Set<PromInstance>()
            .Where(pi => pi.PatientId == patientId && 
                        pi.Status == PromStatus.Completed)
            .Include(pi => pi.Template)
            .OrderBy(pi => pi.CompletedAt)
            .ToListAsync();

        // Filter by template key
        instances = instances.Where(pi => pi.Template?.Name == promTemplateKey).ToList();

        if (instances.Count < 2)
        {
            analysis.HasSufficientData = false;
            analysis.Message = "Insufficient data for MCID analysis (minimum 2 assessments required)";
            return analysis;
        }

        analysis.HasSufficientData = true;
        
        // Get baseline and most recent scores
        var baseline = instances.First();
        var current = instances.Last();
        
        analysis.BaselineScore = baseline.Score ?? CalculateTotalScoreFromDictionary(baseline.ResponseData);
        analysis.CurrentScore = current.Score ?? CalculateTotalScoreFromDictionary(current.ResponseData);
        analysis.BaselineDate = baseline.CompletedAt ?? baseline.CreatedAt;
        analysis.CurrentDate = current.CompletedAt ?? current.CreatedAt;
        analysis.ScoreChange = analysis.CurrentScore - analysis.BaselineScore;
        analysis.PercentageChange = analysis.BaselineScore != 0 
            ? (analysis.ScoreChange / analysis.BaselineScore) * 100 
            : 0;

        // Get MCID thresholds
        var thresholds = await GetMcidThresholds(promTemplateKey);
        var improvementThreshold = thresholds.FirstOrDefault(t => t.MeasureType == "improvement")?.Threshold ?? 0;
        var deteriorationThreshold = thresholds.FirstOrDefault(t => t.MeasureType == "deterioration")?.Threshold ?? 0;

        // Determine clinical significance
        if (analysis.ScoreChange <= deteriorationThreshold)
        {
            analysis.ClinicalSignificance = "clinically_significant_deterioration";
            analysis.HasAchievedMcid = true;
            analysis.McidDirection = "deterioration";
        }
        else if (analysis.ScoreChange >= improvementThreshold)
        {
            analysis.ClinicalSignificance = "clinically_significant_improvement";
            analysis.HasAchievedMcid = true;
            analysis.McidDirection = "improvement";
        }
        else if (analysis.ScoreChange > 0)
        {
            analysis.ClinicalSignificance = "minimal_improvement";
            analysis.HasAchievedMcid = false;
        }
        else if (analysis.ScoreChange < 0)
        {
            analysis.ClinicalSignificance = "minimal_deterioration";
            analysis.HasAchievedMcid = false;
        }
        else
        {
            analysis.ClinicalSignificance = "no_change";
            analysis.HasAchievedMcid = false;
        }

        // Calculate trajectory
        if (instances.Count >= 3)
        {
            var scores = instances.Select(i => i.Score ?? CalculateTotalScoreFromDictionary(i.ResponseData)).ToList();
            analysis.Trajectory = CalculateTrajectory(scores);
            
            // Predict time to MCID if not yet achieved
            if (!analysis.HasAchievedMcid && analysis.Trajectory.Slope != 0)
            {
                var remainingChange = improvementThreshold - analysis.ScoreChange;
                var weeksPerPoint = 1 / Math.Abs(analysis.Trajectory.Slope);
                analysis.PredictedWeeksToMcid = (int)Math.Ceiling(Math.Abs(remainingChange) * weeksPerPoint);
            }
        }

        return analysis;
    }

    public async Task<List<McidThreshold>> GetMcidThresholds(string promTemplateKey)
    {
        // Check for custom thresholds in database
        var customThresholds = await _dbContext.Database
            .SqlQuery<McidThreshold>($@"
                SELECT prom_template_key as PromTemplateKey, 
                       measure_type as MeasureType, 
                       threshold_value as Threshold,
                       created_at as CreatedAt,
                       updated_at as UpdatedAt
                FROM qivr.mcid_thresholds
                WHERE prom_template_key = {promTemplateKey}
            ")
            .ToListAsync();

        if (customThresholds.Any())
        {
            return customThresholds;
        }

        // Return defaults if available
        if (DefaultMcidThresholds.TryGetValue(promTemplateKey.ToUpper(), out var defaults))
        {
            return defaults.Select(d => new McidThreshold
            {
                PromTemplateKey = promTemplateKey,
                MeasureType = d.Key,
                Threshold = d.Value,
                IsDefault = true
            }).ToList();
        }

        // Generic thresholds if no specific ones found
        return new List<McidThreshold>
        {
            new() { PromTemplateKey = promTemplateKey, MeasureType = "improvement", Threshold = 10m, IsDefault = true },
            new() { PromTemplateKey = promTemplateKey, MeasureType = "deterioration", Threshold = -10m, IsDefault = true }
        };
    }

    public async Task UpdateMcidThreshold(string promTemplateKey, string measureType, decimal threshold)
    {
        await _dbContext.Database.ExecuteSqlAsync($@"
            INSERT INTO qivr.mcid_thresholds (id, prom_template_key, measure_type, threshold_value, created_at, updated_at)
            VALUES ({Guid.NewGuid()}, {promTemplateKey}, {measureType}, {threshold}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (prom_template_key, measure_type) 
            DO UPDATE SET threshold_value = {threshold}, updated_at = CURRENT_TIMESTAMP
        ");
    }

    public async Task<bool> HasAchievedMcid(Guid patientId, string promTemplateKey, DateTime? fromDate = null)
    {
        var analysis = await AnalyzePromProgress(patientId, promTemplateKey);
        
        if (!analysis.HasSufficientData)
            return false;
            
        if (fromDate.HasValue && analysis.BaselineDate < fromDate)
            return false;
            
        return analysis.HasAchievedMcid;
    }

    public async Task<McidReport> GenerateMcidReport(Guid clinicId, DateTime startDate, DateTime endDate)
    {
        var report = new McidReport
        {
            ClinicId = clinicId,
            StartDate = startDate,
            EndDate = endDate,
            GeneratedAt = DateTime.UtcNow
        };

        // Get all patients with completed PROMs in the period
        var patientProms = await _dbContext.Database
            .SqlQuery<PatientPromSummary>($@"
                SELECT DISTINCT 
                    pi.patient_id as PatientId,
                    pt.key as PromTemplateKey,
                    COUNT(*) as InstanceCount,
                    MIN(pi.completed_at) as FirstAssessment,
                    MAX(pi.completed_at) as LastAssessment
                FROM qivr.prom_instances pi
                JOIN qivr.prom_templates pt ON pi.prom_template_id = pt.id
                JOIN qivr.patients p ON pi.patient_id = p.id
                WHERE p.clinic_id = {clinicId}
                    AND pi.status = 'completed'
                    AND pi.completed_at BETWEEN {startDate} AND {endDate}
                GROUP BY pi.patient_id, pt.key
                HAVING COUNT(*) >= 2
            ")
            .ToListAsync();

        report.TotalPatients = patientProms.Select(p => p.PatientId).Distinct().Count();
        report.TotalAssessments = patientProms.Sum(p => p.InstanceCount);

        // Analyze MCID achievement for each patient-PROM combination
        var mcidResults = new List<McidResult>();
        
        foreach (var pp in patientProms)
        {
            var analysis = await AnalyzePromProgress(pp.PatientId, pp.PromTemplateKey);
            
            if (analysis.HasSufficientData)
            {
                mcidResults.Add(new McidResult
                {
                    PatientId = pp.PatientId,
                    PromTemplateKey = pp.PromTemplateKey,
                    AchievedMcid = analysis.HasAchievedMcid,
                    Direction = analysis.McidDirection,
                    ScoreChange = analysis.ScoreChange,
                    ClinicalSignificance = analysis.ClinicalSignificance
                });
            }
        }

        // Calculate summary statistics
        report.PatientsAchievingMcid = mcidResults.Count(r => r.AchievedMcid && r.Direction == "improvement");
        report.PatientsWithDeterioration = mcidResults.Count(r => r.AchievedMcid && r.Direction == "deterioration");
        report.PatientsWithMinimalChange = mcidResults.Count(r => !r.AchievedMcid);
        
        report.McidAchievementRate = report.TotalPatients > 0 
            ? (decimal)report.PatientsAchievingMcid / report.TotalPatients * 100 
            : 0;

        // Group by PROM type
        report.ResultsByPromType = mcidResults
            .GroupBy(r => r.PromTemplateKey)
            .Select(g => new PromTypeMcidSummary
            {
                PromTemplateKey = g.Key,
                TotalPatients = g.Count(),
                AchievedMcid = g.Count(r => r.AchievedMcid && r.Direction == "improvement"),
                Deteriorated = g.Count(r => r.AchievedMcid && r.Direction == "deterioration"),
                MinimalChange = g.Count(r => !r.AchievedMcid),
                AverageScoreChange = g.Average(r => r.ScoreChange),
                AchievementRate = g.Count() > 0 
                    ? (decimal)g.Count(r => r.AchievedMcid && r.Direction == "improvement") / g.Count() * 100 
                    : 0
            })
            .ToList();

        return report;
    }

    private decimal CalculateTotalScoreFromDictionary(Dictionary<string, object>? responses)
    {
        if (responses == null) return 0;
        
        // Calculate total score based on numeric responses in the dictionary
        decimal total = 0;
        foreach (var kvp in responses)
        {
            if (decimal.TryParse(kvp.Value?.ToString(), out var value))
            {
                total += value;
            }
        }
        return total;
    }

    private Trajectory CalculateTrajectory(List<decimal> scores)
    {
        if (scores.Count < 2)
            return new Trajectory { Slope = 0, Trend = "stable" };

        // Simple linear regression
        var n = scores.Count;
        var xValues = Enumerable.Range(0, n).Select(i => (decimal)i).ToList();
        
        var xMean = xValues.Average();
        var yMean = scores.Average();
        
        var numerator = xValues.Zip(scores, (x, y) => (x - xMean) * (y - yMean)).Sum();
        var denominator = xValues.Sum(x => Math.Pow((double)(x - xMean), 2));
        
        var slope = denominator != 0 ? (decimal)(numerator / (decimal)denominator) : 0;
        
        return new Trajectory
        {
            Slope = slope,
            Trend = slope > 0.5m ? "improving" : slope < -0.5m ? "deteriorating" : "stable",
            RSquared = CalculateRSquared(scores, xValues, slope, yMean)
        };
    }

    private decimal CalculateRSquared(List<decimal> yValues, List<decimal> xValues, decimal slope, decimal yMean)
    {
        var yIntercept = yMean - slope * xValues.Average();
        var predictions = xValues.Select(x => slope * x + yIntercept).ToList();
        
        var ssRes = yValues.Zip(predictions, (y, pred) => Math.Pow((double)(y - pred), 2)).Sum();
        var ssTot = yValues.Sum(y => Math.Pow((double)(y - yMean), 2));
        
        return ssTot != 0 ? (decimal)(1 - ssRes / ssTot) : 0;
    }
}

// MCID Analysis Models
public class McidAnalysis
{
    public Guid PatientId { get; set; }
    public string PromTemplateKey { get; set; } = string.Empty;
    public DateTime AnalysisDate { get; set; }
    public bool HasSufficientData { get; set; }
    public string? Message { get; set; }
    
    public decimal BaselineScore { get; set; }
    public decimal CurrentScore { get; set; }
    public decimal ScoreChange { get; set; }
    public decimal PercentageChange { get; set; }
    
    public DateTime BaselineDate { get; set; }
    public DateTime CurrentDate { get; set; }
    
    public bool HasAchievedMcid { get; set; }
    public string? McidDirection { get; set; } // "improvement" or "deterioration"
    public string? ClinicalSignificance { get; set; }
    
    public Trajectory? Trajectory { get; set; }
    public int? PredictedWeeksToMcid { get; set; }
}

public class McidThreshold
{
    public string PromTemplateKey { get; set; } = string.Empty;
    public string MeasureType { get; set; } = string.Empty; // "improvement" or "deterioration"
    public decimal Threshold { get; set; }
    public bool IsDefault { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class McidReport
{
    public Guid ClinicId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public DateTime GeneratedAt { get; set; }
    
    public int TotalPatients { get; set; }
    public int TotalAssessments { get; set; }
    public int PatientsAchievingMcid { get; set; }
    public int PatientsWithDeterioration { get; set; }
    public int PatientsWithMinimalChange { get; set; }
    
    public decimal McidAchievementRate { get; set; }
    public List<PromTypeMcidSummary> ResultsByPromType { get; set; } = new();
}

public class PromTypeMcidSummary
{
    public string PromTemplateKey { get; set; } = string.Empty;
    public int TotalPatients { get; set; }
    public int AchievedMcid { get; set; }
    public int Deteriorated { get; set; }
    public int MinimalChange { get; set; }
    public decimal AverageScoreChange { get; set; }
    public decimal AchievementRate { get; set; }
}

public class Trajectory
{
    public decimal Slope { get; set; }
    public string Trend { get; set; } = "stable"; // "improving", "stable", "deteriorating"
    public decimal RSquared { get; set; }
}

public class McidResult
{
    public Guid PatientId { get; set; }
    public string PromTemplateKey { get; set; } = string.Empty;
    public bool AchievedMcid { get; set; }
    public string? Direction { get; set; }
    public decimal ScoreChange { get; set; }
    public string? ClinicalSignificance { get; set; }
}

public class PatientPromSummary
{
    public Guid PatientId { get; set; }
    public string PromTemplateKey { get; set; } = string.Empty;
    public int InstanceCount { get; set; }
    public DateTime FirstAssessment { get; set; }
    public DateTime LastAssessment { get; set; }
}
