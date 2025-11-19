using Microsoft.EntityFrameworkCore;
using Qivr.Core.Entities;
using Qivr.Infrastructure.Data;

namespace Qivr.Services;

public interface IPainPatternRecognitionService
{
    Task<PainPatternAnalysis> AnalyzePatternAsync(Guid painMapId, CancellationToken cancellationToken = default);
    Task<List<ConditionPrediction>> PredictConditionsAsync(Guid painMapId, CancellationToken cancellationToken = default);
}

public class PainPatternRecognitionService : IPainPatternRecognitionService
{
    private readonly QivrDbContext _context;

    public PainPatternRecognitionService(QivrDbContext context)
    {
        _context = context;
    }

    public async Task<PainPatternAnalysis> AnalyzePatternAsync(Guid painMapId, CancellationToken cancellationToken = default)
    {
        var painMap = await _context.PainMaps.FindAsync(new object[] { painMapId }, cancellationToken);
        if (painMap == null) throw new ArgumentException("Pain map not found");

        var analysis = new PainPatternAnalysis
        {
            PainMapId = painMapId,
            Patterns = new List<string>()
        };

        // Analyze pain distribution
        if (painMap.BodyRegion.Contains("bilateral", StringComparison.OrdinalIgnoreCase) ||
            painMap.BodyRegion.Contains("both", StringComparison.OrdinalIgnoreCase))
        {
            analysis.Patterns.Add("Bilateral distribution");
            analysis.SuggestedConditions.Add("Fibromyalgia");
            analysis.SuggestedConditions.Add("Rheumatoid Arthritis");
            analysis.SuggestedConditions.Add("Polymyalgia Rheumatica");
        }

        // Analyze pain qualities
        if (painMap.PainQuality.Any(q => q.Contains("Burning", StringComparison.OrdinalIgnoreCase) ||
                                          q.Contains("Tingling", StringComparison.OrdinalIgnoreCase)))
        {
            analysis.Patterns.Add("Neuropathic characteristics");
            analysis.SuggestedConditions.Add("Peripheral Neuropathy");
            analysis.SuggestedConditions.Add("Radiculopathy");
            analysis.SuggestedConditions.Add("Complex Regional Pain Syndrome");
        }

        if (painMap.PainQuality.Any(q => q.Contains("Throbbing", StringComparison.OrdinalIgnoreCase)))
        {
            analysis.Patterns.Add("Inflammatory characteristics");
            analysis.SuggestedConditions.Add("Inflammatory Arthritis");
            analysis.SuggestedConditions.Add("Tendinitis");
        }

        // Analyze intensity
        if (painMap.PainIntensity >= 7)
        {
            analysis.Patterns.Add("High intensity pain");
            analysis.UrgencyLevel = "High";
        }
        else if (painMap.PainIntensity >= 4)
        {
            analysis.Patterns.Add("Moderate intensity pain");
            analysis.UrgencyLevel = "Medium";
        }
        else
        {
            analysis.Patterns.Add("Low intensity pain");
            analysis.UrgencyLevel = "Low";
        }

        // Analyze depth
        if (painMap.DepthIndicator == "deep")
        {
            analysis.Patterns.Add("Deep tissue involvement");
            analysis.SuggestedConditions.Add("Muscle Strain");
            analysis.SuggestedConditions.Add("Joint Pathology");
        }

        // Dermatomal pattern detection
        if (painMap.BodySubdivision?.Contains("dermatome", StringComparison.OrdinalIgnoreCase) == true)
        {
            analysis.Patterns.Add("Dermatomal distribution");
            analysis.SuggestedConditions.Add("Nerve Root Compression");
            analysis.SuggestedConditions.Add("Herniated Disc");
            analysis.SuggestedConditions.Add("Spinal Stenosis");
        }

        analysis.Confidence = CalculateConfidence(analysis.Patterns.Count);
        
        return analysis;
    }

    public async Task<List<ConditionPrediction>> PredictConditionsAsync(Guid painMapId, CancellationToken cancellationToken = default)
    {
        var analysis = await AnalyzePatternAsync(painMapId, cancellationToken);
        var predictions = new List<ConditionPrediction>();

        // Score each suggested condition
        foreach (var condition in analysis.SuggestedConditions.Distinct())
        {
            var score = CalculateConditionScore(condition, analysis);
            predictions.Add(new ConditionPrediction
            {
                Condition = condition,
                Probability = score,
                SupportingPatterns = analysis.Patterns.Where(p => IsPatternRelevant(p, condition)).ToList()
            });
        }

        return predictions.OrderByDescending(p => p.Probability).Take(5).ToList();
    }

    private double CalculateConfidence(int patternCount)
    {
        // More patterns = higher confidence
        return Math.Min(patternCount * 15.0, 95.0);
    }

    private double CalculateConditionScore(string condition, PainPatternAnalysis analysis)
    {
        var score = 50.0; // Base score

        // Adjust based on pattern matches
        if (condition.Contains("Neuropath") && analysis.Patterns.Any(p => p.Contains("Neuropathic")))
            score += 30;
        
        if (condition.Contains("Fibromyalgia") && analysis.Patterns.Any(p => p.Contains("Bilateral")))
            score += 25;
        
        if (condition.Contains("Nerve") && analysis.Patterns.Any(p => p.Contains("Dermatomal")))
            score += 35;

        if (condition.Contains("Inflammatory") && analysis.Patterns.Any(p => p.Contains("Inflammatory")))
            score += 30;

        return Math.Min(score, 95.0);
    }

    private bool IsPatternRelevant(string pattern, string condition)
    {
        var patternLower = pattern.ToLower();
        var conditionLower = condition.ToLower();

        if (patternLower.Contains("neuropathic") && conditionLower.Contains("neuropath"))
            return true;
        if (patternLower.Contains("bilateral") && conditionLower.Contains("fibromyalgia"))
            return true;
        if (patternLower.Contains("dermatomal") && conditionLower.Contains("nerve"))
            return true;
        if (patternLower.Contains("inflammatory") && conditionLower.Contains("arthritis"))
            return true;

        return false;
    }
}

public class PainPatternAnalysis
{
    public Guid PainMapId { get; set; }
    public List<string> Patterns { get; set; } = new();
    public List<string> SuggestedConditions { get; set; } = new();
    public string UrgencyLevel { get; set; } = "Low";
    public double Confidence { get; set; }
}

public class ConditionPrediction
{
    public string Condition { get; set; } = string.Empty;
    public double Probability { get; set; }
    public List<string> SupportingPatterns { get; set; } = new();
}
