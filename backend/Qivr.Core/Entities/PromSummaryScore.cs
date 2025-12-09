using Qivr.Core.Common;

namespace Qivr.Core.Entities;

/// <summary>
/// Stores calculated summary scores for a PROM instance.
/// One instance can have multiple summary scores (total, subscales, domains).
/// </summary>
public class PromSummaryScore : TenantEntity
{
    /// <summary>
    /// Reference to the PROM instance
    /// </summary>
    public Guid InstanceId { get; set; }

    /// <summary>
    /// Reference to the score definition (for full metadata)
    /// </summary>
    public Guid? DefinitionId { get; set; }

    /// <summary>
    /// Denormalized score key for easy querying (e.g., "total", "pain", "function")
    /// </summary>
    public string ScoreKey { get; set; } = string.Empty;

    /// <summary>
    /// Denormalized label for display
    /// </summary>
    public string? Label { get; set; }

    /// <summary>
    /// Calculated score value
    /// </summary>
    public decimal Value { get; set; }

    /// <summary>
    /// Raw score before normalization (if applicable)
    /// </summary>
    public decimal? RawValue { get; set; }

    /// <summary>
    /// Score range minimum (denormalized for display)
    /// </summary>
    public decimal? RangeMin { get; set; }

    /// <summary>
    /// Score range maximum (denormalized for display)
    /// </summary>
    public decimal? RangeMax { get; set; }

    /// <summary>
    /// Whether higher is better (denormalized for display)
    /// </summary>
    public bool? HigherIsBetter { get; set; }

    /// <summary>
    /// Interpretation band label (e.g., "Minimal", "Moderate", "Severe")
    /// </summary>
    public string? InterpretationBand { get; set; }

    /// <summary>
    /// Severity level from interpretation (e.g., "low", "medium", "high")
    /// </summary>
    public string? Severity { get; set; }

    /// <summary>
    /// Number of items included in this score calculation
    /// </summary>
    public int? ItemCount { get; set; }

    /// <summary>
    /// Number of items that were missing/skipped
    /// </summary>
    public int? MissingItemCount { get; set; }

    /// <summary>
    /// Confidence interval lower bound (for IRT-based scores)
    /// </summary>
    public decimal? ConfidenceIntervalLower { get; set; }

    /// <summary>
    /// Confidence interval upper bound (for IRT-based scores)
    /// </summary>
    public decimal? ConfidenceIntervalUpper { get; set; }

    /// <summary>
    /// Whether floor effect detected (score at minimum)
    /// </summary>
    public bool HasFloorEffect { get; set; } = false;

    /// <summary>
    /// Whether ceiling effect detected (score at maximum)
    /// </summary>
    public bool HasCeilingEffect { get; set; } = false;

    // Navigation properties
    public virtual PromInstance? Instance { get; set; }
    public virtual SummaryScoreDefinition? Definition { get; set; }
}
