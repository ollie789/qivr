using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Qivr.Core.Entities;

namespace Qivr.Services.Clinical;

/// <summary>
/// Advanced scoring algorithms for PROM assessments
/// </summary>
public interface IAdvancedScoringService
{
    Task<ScoringResult> CalculateScores(PromInstance instance, List<PromResponse> responses, ScoringConfig? config = null);
    Task<CompositeScore> CalculateCompositeScore(List<PromInstance> instances, CompositeScoreConfig config);
    ScoringConfig GetDefaultScoringConfig(string promTemplateKey);
    decimal NormalizeScore(decimal rawScore, NormalizationMethod method, decimal? min = null, decimal? max = null);
}

public class AdvancedScoringService : IAdvancedScoringService
{
    private readonly ILogger<AdvancedScoringService> _logger;
    
    // Standard scoring configurations for common PROMs
    private static readonly Dictionary<string, ScoringConfig> StandardScoringConfigs = new()
    {
        ["ODI"] = new ScoringConfig
        {
            ScoringMethod = ScoringMethod.Percentage,
            MaxPossibleScore = 50,
            MinPossibleScore = 0,
            InterpretationScale = InterpretationScale.HigherWorse,
            Domains = new List<ScoringDomain>
            {
                new() { Name = "Pain Intensity", QuestionIds = new[] { "q1" }, Weight = 1.0m },
                new() { Name = "Personal Care", QuestionIds = new[] { "q2" }, Weight = 1.0m },
                new() { Name = "Lifting", QuestionIds = new[] { "q3" }, Weight = 1.0m },
                new() { Name = "Walking", QuestionIds = new[] { "q4" }, Weight = 1.0m },
                new() { Name = "Sitting", QuestionIds = new[] { "q5" }, Weight = 1.0m },
                new() { Name = "Standing", QuestionIds = new[] { "q6" }, Weight = 1.0m },
                new() { Name = "Sleeping", QuestionIds = new[] { "q7" }, Weight = 1.0m },
                new() { Name = "Sex Life", QuestionIds = new[] { "q8" }, Weight = 1.0m },
                new() { Name = "Social Life", QuestionIds = new[] { "q9" }, Weight = 1.0m },
                new() { Name = "Travelling", QuestionIds = new[] { "q10" }, Weight = 1.0m }
            }
        },
        ["SF36"] = new ScoringConfig
        {
            ScoringMethod = ScoringMethod.TScore,
            MaxPossibleScore = 100,
            MinPossibleScore = 0,
            InterpretationScale = InterpretationScale.HigherBetter,
            PopulationMean = 50,
            PopulationStdDev = 10,
            Domains = new List<ScoringDomain>
            {
                new() { Name = "Physical Functioning", QuestionIds = new[] { "q3a", "q3b", "q3c", "q3d", "q3e", "q3f", "q3g", "q3h", "q3i", "q3j" }, Weight = 1.0m },
                new() { Name = "Role Physical", QuestionIds = new[] { "q4a", "q4b", "q4c", "q4d" }, Weight = 1.0m },
                new() { Name = "Bodily Pain", QuestionIds = new[] { "q7", "q8" }, Weight = 1.0m },
                new() { Name = "General Health", QuestionIds = new[] { "q1", "q11a", "q11b", "q11c", "q11d" }, Weight = 1.0m },
                new() { Name = "Vitality", QuestionIds = new[] { "q9a", "q9e", "q9g", "q9i" }, Weight = 1.0m },
                new() { Name = "Social Functioning", QuestionIds = new[] { "q6", "q10" }, Weight = 1.0m },
                new() { Name = "Role Emotional", QuestionIds = new[] { "q5a", "q5b", "q5c" }, Weight = 1.0m },
                new() { Name = "Mental Health", QuestionIds = new[] { "q9b", "q9c", "q9d", "q9f", "q9h" }, Weight = 1.0m }
            }
        }
    };

    public AdvancedScoringService(ILogger<AdvancedScoringService> logger)
    {
        _logger = logger;
    }

    public async Task<ScoringResult> CalculateScores(PromInstance instance, List<PromResponse> responses, ScoringConfig? config = null)
    {
        var result = new ScoringResult
        {
            PromInstanceId = instance.Id,
            CalculatedAt = DateTime.UtcNow
        };

        // Use provided config or get default
        config ??= GetDefaultScoringConfig(instance.Template?.Name ?? "default");
        
        // Calculate raw score
        result.RawScore = CalculateRawScore(responses, config);
        
        // Calculate weighted score if weights are defined
        if (config.UseWeighting && config.Domains?.Any() == true)
        {
            result.WeightedScore = CalculateWeightedScore(responses, config);
        }
        else
        {
            result.WeightedScore = result.RawScore;
        }
        
        // Normalize score based on method
        switch (config.ScoringMethod)
        {
            case ScoringMethod.Percentage:
                result.NormalizedScore = NormalizeToPercentage(result.WeightedScore, config);
                result.ScoreType = "percentage";
                break;
                
            case ScoringMethod.TScore:
                result.NormalizedScore = NormalizeToTScore(result.WeightedScore, config);
                result.ScoreType = "t-score";
                break;
                
            case ScoringMethod.ZScore:
                result.NormalizedScore = NormalizeToZScore(result.WeightedScore, config);
                result.ScoreType = "z-score";
                break;
                
            case ScoringMethod.Rasch:
                result.NormalizedScore = await CalculateRaschScore(responses, config);
                result.ScoreType = "rasch";
                break;
                
            default:
                result.NormalizedScore = result.WeightedScore;
                result.ScoreType = "raw";
                break;
        }
        
        // Calculate domain scores if configured
        if (config.Domains?.Any() == true)
        {
            result.DomainScores = CalculateDomainScores(responses, config);
        }
        
        // Determine interpretation
        result.Interpretation = InterpretScore(result.NormalizedScore, config);
        
        // Calculate confidence interval if applicable
        if (config.CalculateConfidenceInterval)
        {
            result.ConfidenceInterval = CalculateConfidenceInterval(result.NormalizedScore, responses.Count, config);
        }
        
        // Check for floor/ceiling effects
        result.HasFloorEffect = CheckFloorEffect(result.RawScore, config);
        result.HasCeilingEffect = CheckCeilingEffect(result.RawScore, config);
        
        return result;
    }

    public async Task<CompositeScore> CalculateCompositeScore(List<PromInstance> instances, CompositeScoreConfig config)
    {
        var composite = new CompositeScore
        {
            CalculatedAt = DateTime.UtcNow,
            ComponentScores = new List<ComponentScore>()
        };
        
        foreach (var instance in instances)
        {
            // Convert Dictionary responses to PromResponse list
            var responses = ConvertDictionaryToPromResponses(instance.ResponseData);
            var scoringConfig = GetDefaultScoringConfig(instance.Template?.Name ?? "default");
            var score = await CalculateScores(instance, responses, scoringConfig);
            
            var weight = config.ComponentWeights?.GetValueOrDefault(instance.Template?.Name ?? "", 1.0m) ?? 1.0m;
            
            composite.ComponentScores.Add(new ComponentScore
            {
                PromTemplateKey = instance.Template?.Name ?? "",
                Score = score.NormalizedScore,
                Weight = weight,
                PromInstanceId = instance.Id
            });
        }
        
        // Calculate composite based on aggregation method
        switch (config.AggregationMethod)
        {
            case AggregationMethod.WeightedAverage:
                var totalWeight = composite.ComponentScores.Sum(c => c.Weight);
                composite.CompositeValue = composite.ComponentScores.Sum(c => c.Score * c.Weight) / totalWeight;
                break;
                
            case AggregationMethod.GeometricMean:
                var product = 1.0m;
                foreach (var component in composite.ComponentScores)
                {
                    product *= (decimal)Math.Pow((double)component.Score, (double)component.Weight);
                }
                composite.CompositeValue = (decimal)Math.Pow((double)product, 1.0 / composite.ComponentScores.Count);
                break;
                
            case AggregationMethod.Maximum:
                composite.CompositeValue = composite.ComponentScores.Max(c => c.Score);
                break;
                
            case AggregationMethod.Minimum:
                composite.CompositeValue = composite.ComponentScores.Min(c => c.Score);
                break;
                
            default:
                composite.CompositeValue = composite.ComponentScores.Average(c => c.Score);
                break;
        }
        
        // Normalize composite if requested
        if (config.NormalizeComposite)
        {
            composite.NormalizedComposite = NormalizeScore(
                composite.CompositeValue, 
                NormalizationMethod.MinMax, 
                0, 
                100);
        }
        
        return composite;
    }

    public ScoringConfig GetDefaultScoringConfig(string promTemplateKey)
    {
        if (StandardScoringConfigs.TryGetValue(promTemplateKey.ToUpper(), out var config))
        {
            return config;
        }
        
        // Return generic config
        return new ScoringConfig
        {
            ScoringMethod = ScoringMethod.Simple,
            MaxPossibleScore = 100,
            MinPossibleScore = 0,
            InterpretationScale = InterpretationScale.HigherBetter
        };
    }

    public decimal NormalizeScore(decimal rawScore, NormalizationMethod method, decimal? min = null, decimal? max = null)
    {
        switch (method)
        {
            case NormalizationMethod.MinMax:
                if (min.HasValue && max.HasValue && max.Value != min.Value)
                {
                    return ((rawScore - min.Value) / (max.Value - min.Value)) * 100;
                }
                return rawScore;
                
            case NormalizationMethod.ZScore:
                // Requires population parameters
                return rawScore;
                
            case NormalizationMethod.Percentile:
                // Requires reference population
                return rawScore;
                
            default:
                return rawScore;
        }
    }

    private decimal CalculateRawScore(List<PromResponse> responses, ScoringConfig config)
    {
        decimal sum = 0;
        int count = 0;
        
        foreach (var response in responses)
        {
            if (decimal.TryParse(response.ResponseValue?.ToString(), out var value))
            {
                // Apply reverse scoring if needed
                if (config.ReverseScoreItems?.Contains(response.QuestionId) == true)
                {
                    value = config.MaxItemScore - value + config.MinItemScore;
                }
                
                sum += value;
                count++;
            }
        }
        
        // Handle missing data based on config
        if (config.MissingDataHandling == MissingDataHandling.ProRate && count > 0)
        {
            var expectedCount = config.ExpectedItemCount ?? responses.Count;
            if (count >= expectedCount * config.MinimumDataThreshold)
            {
                return (sum / count) * expectedCount;
            }
        }
        
        return sum;
    }

    private decimal CalculateWeightedScore(List<PromResponse> responses, ScoringConfig config)
    {
        if (config.Domains == null || !config.Domains.Any())
            return CalculateRawScore(responses, config);
        
        decimal totalScore = 0;
        decimal totalWeight = 0;
        
        foreach (var domain in config.Domains)
        {
            var domainResponses = responses.Where(r => domain.QuestionIds.Contains(r.QuestionId)).ToList();
            if (domainResponses.Any())
            {
                var domainScore = CalculateRawScore(domainResponses, config);
                totalScore += domainScore * domain.Weight;
                totalWeight += domain.Weight;
            }
        }
        
        return totalWeight > 0 ? totalScore / totalWeight : 0;
    }

    private decimal NormalizeToPercentage(decimal score, ScoringConfig config)
    {
        var range = config.MaxPossibleScore - config.MinPossibleScore;
        if (range <= 0) return 0;
        
        return ((score - config.MinPossibleScore) / range) * 100;
    }

    private decimal NormalizeToTScore(decimal score, ScoringConfig config)
    {
        if (!config.PopulationMean.HasValue || !config.PopulationStdDev.HasValue)
            return score;
        
        var zScore = (score - config.PopulationMean.Value) / config.PopulationStdDev.Value;
        return 50 + (zScore * 10); // T-score formula
    }

    private decimal NormalizeToZScore(decimal score, ScoringConfig config)
    {
        if (!config.PopulationMean.HasValue || !config.PopulationStdDev.HasValue)
            return 0;
        
        return (score - config.PopulationMean.Value) / config.PopulationStdDev.Value;
    }

    private async Task<decimal> CalculateRaschScore(List<PromResponse> responses, ScoringConfig config)
    {
        // Simplified Rasch scoring - in production, use proper IRT library
        await Task.CompletedTask;
        
        var rawScore = CalculateRawScore(responses, config);
        var maxScore = config.MaxPossibleScore;
        
        // Convert to logit scale (simplified)
        if (rawScore <= 0) return -5;
        if (rawScore >= maxScore) return 5;
        
        var proportion = rawScore / maxScore;
        return (decimal)Math.Log((double)proportion / (1 - (double)proportion));
    }

    private Dictionary<string, decimal> CalculateDomainScores(List<PromResponse> responses, ScoringConfig config)
    {
        var domainScores = new Dictionary<string, decimal>();
        
        if (config.Domains == null) return domainScores;
        
        foreach (var domain in config.Domains)
        {
            var domainResponses = responses.Where(r => domain.QuestionIds.Contains(r.QuestionId)).ToList();
            if (domainResponses.Any())
            {
                var score = CalculateRawScore(domainResponses, config);
                var normalizedScore = NormalizeToPercentage(score, config);
                domainScores[domain.Name] = normalizedScore;
            }
        }
        
        return domainScores;
    }

    private string InterpretScore(decimal score, ScoringConfig config)
    {
        if (config.InterpretationThresholds == null || !config.InterpretationThresholds.Any())
        {
            // Default interpretation based on percentage
            return score switch
            {
                < 20 => config.InterpretationScale == InterpretationScale.HigherBetter ? "Poor" : "Minimal",
                < 40 => config.InterpretationScale == InterpretationScale.HigherBetter ? "Fair" : "Mild",
                < 60 => config.InterpretationScale == InterpretationScale.HigherBetter ? "Good" : "Moderate",
                < 80 => config.InterpretationScale == InterpretationScale.HigherBetter ? "Very Good" : "Severe",
                _ => config.InterpretationScale == InterpretationScale.HigherBetter ? "Excellent" : "Extreme"
            };
        }
        
        // Use custom thresholds
        foreach (var threshold in config.InterpretationThresholds.OrderBy(t => t.Value))
        {
            if (score <= threshold.Value)
                return threshold.Key;
        }
        
        return "Unknown";
    }

    private ConfidenceInterval CalculateConfidenceInterval(decimal score, int sampleSize, ScoringConfig config)
    {
        // Calculate standard error (simplified)
        var standardError = config.PopulationStdDev ?? 10m / (decimal)Math.Sqrt(sampleSize);
        var marginOfError = 1.96m * standardError; // 95% confidence
        
        return new ConfidenceInterval
        {
            Lower = score - marginOfError,
            Upper = score + marginOfError,
            Level = 0.95m
        };
    }

    private bool CheckFloorEffect(decimal score, ScoringConfig config)
    {
        return score <= config.MinPossibleScore + (config.MaxPossibleScore - config.MinPossibleScore) * 0.1m;
    }

    private bool CheckCeilingEffect(decimal score, ScoringConfig config)
    {
        return score >= config.MaxPossibleScore - (config.MaxPossibleScore - config.MinPossibleScore) * 0.1m;
    }

    private List<PromResponse> ConvertDictionaryToPromResponses(Dictionary<string, object>? responses)
    {
        var promResponses = new List<PromResponse>();
        if (responses == null) return promResponses;
        
        foreach (var kvp in responses)
        {
            promResponses.Add(new PromResponse
            {
                QuestionId = kvp.Key,
                ResponseValue = kvp.Value
            });
        }
        
        return promResponses;
    }
}

// Scoring Models
public class ScoringResult
{
    public Guid PromInstanceId { get; set; }
    public decimal RawScore { get; set; }
    public decimal WeightedScore { get; set; }
    public decimal NormalizedScore { get; set; }
    public string ScoreType { get; set; } = "raw";
    public Dictionary<string, decimal>? DomainScores { get; set; }
    public string? Interpretation { get; set; }
    public ConfidenceInterval? ConfidenceInterval { get; set; }
    public bool HasFloorEffect { get; set; }
    public bool HasCeilingEffect { get; set; }
    public DateTime CalculatedAt { get; set; }
}

public class ScoringConfig
{
    public ScoringMethod ScoringMethod { get; set; } = ScoringMethod.Simple;
    public decimal MaxPossibleScore { get; set; }
    public decimal MinPossibleScore { get; set; }
    public decimal MaxItemScore { get; set; } = 5;
    public decimal MinItemScore { get; set; } = 0;
    public InterpretationScale InterpretationScale { get; set; } = InterpretationScale.HigherBetter;
    public bool UseWeighting { get; set; }
    public List<ScoringDomain>? Domains { get; set; }
    public List<string>? ReverseScoreItems { get; set; }
    public int? ExpectedItemCount { get; set; }
    public decimal MinimumDataThreshold { get; set; } = 0.8m;
    public MissingDataHandling MissingDataHandling { get; set; } = MissingDataHandling.ExcludeCase;
    public decimal? PopulationMean { get; set; }
    public decimal? PopulationStdDev { get; set; }
    public Dictionary<string, decimal>? InterpretationThresholds { get; set; }
    public bool CalculateConfidenceInterval { get; set; }
}

public class ScoringDomain
{
    public string Name { get; set; } = string.Empty;
    public string[] QuestionIds { get; set; } = Array.Empty<string>();
    public decimal Weight { get; set; } = 1.0m;
}

public class CompositeScore
{
    public decimal CompositeValue { get; set; }
    public decimal? NormalizedComposite { get; set; }
    public List<ComponentScore> ComponentScores { get; set; } = new();
    public DateTime CalculatedAt { get; set; }
}

public class ComponentScore
{
    public string PromTemplateKey { get; set; } = string.Empty;
    public Guid PromInstanceId { get; set; }
    public decimal Score { get; set; }
    public decimal Weight { get; set; }
}

public class CompositeScoreConfig
{
    public AggregationMethod AggregationMethod { get; set; } = AggregationMethod.WeightedAverage;
    public Dictionary<string, decimal>? ComponentWeights { get; set; }
    public bool NormalizeComposite { get; set; }
}

public class ConfidenceInterval
{
    public decimal Lower { get; set; }
    public decimal Upper { get; set; }
    public decimal Level { get; set; } = 0.95m;
}

public enum ScoringMethod
{
    Simple,
    Percentage,
    TScore,
    ZScore,
    Rasch,
    Weighted
}

public enum InterpretationScale
{
    HigherBetter,
    HigherWorse
}

public enum MissingDataHandling
{
    ExcludeCase,
    ProRate,
    Impute
}

public enum NormalizationMethod
{
    MinMax,
    ZScore,
    Percentile
}

public enum AggregationMethod
{
    Average,
    WeightedAverage,
    GeometricMean,
    Maximum,
    Minimum
}

// PromResponse DTO for service use
public class PromResponse
{
    public string QuestionId { get; set; } = string.Empty;
    public object? ResponseValue { get; set; }
}
