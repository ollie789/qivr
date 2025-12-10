using System.Text.Json.Serialization;
using Qivr.Core.Common;

namespace Qivr.Core.Entities;

/// <summary>
/// Defines a summary score that can be calculated for a PROM template.
/// Each template can have multiple summary scores (total, subscales, domains).
/// </summary>
public class SummaryScoreDefinition : TenantEntity
{
    /// <summary>
    /// Reference to the parent template
    /// </summary>
    public Guid TemplateId { get; set; }

    /// <summary>
    /// Unique key for this score within the template (e.g., "total", "pain", "function")
    /// </summary>
    public string ScoreKey { get; set; } = string.Empty;

    /// <summary>
    /// Human-friendly label (e.g., "Total disability score", "Pain subscale")
    /// </summary>
    public string Label { get; set; } = string.Empty;

    /// <summary>
    /// Description of what this score measures
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Method used to calculate this score
    /// </summary>
    public ScoringMethodType ScoringMethod { get; set; } = ScoringMethodType.Sum;

    /// <summary>
    /// Minimum possible score value
    /// </summary>
    public decimal RangeMin { get; set; } = 0;

    /// <summary>
    /// Maximum possible score value
    /// </summary>
    public decimal RangeMax { get; set; } = 100;

    /// <summary>
    /// Whether a higher score indicates better outcomes
    /// </summary>
    public bool HigherIsBetter { get; set; } = false;

    /// <summary>
    /// Population mean for T-score calculation
    /// </summary>
    public decimal? PopulationMean { get; set; }

    /// <summary>
    /// Population standard deviation for T-score calculation
    /// </summary>
    public decimal? PopulationStdDev { get; set; }

    /// <summary>
    /// Interpretation bands as JSON array: [{min, max, label, severity}]
    /// </summary>
    public List<InterpretationBand>? InterpretationBands { get; set; }

    /// <summary>
    /// Minimum Clinically Important Difference for this score
    /// </summary>
    public decimal? MCID { get; set; }

    /// <summary>
    /// Display order when showing multiple scores
    /// </summary>
    public int OrderIndex { get; set; }

    /// <summary>
    /// Whether this is the primary/total score for the instrument
    /// </summary>
    public bool IsPrimary { get; set; } = false;

    /// <summary>
    /// For External/Lookup scoring: identifies the data source
    /// e.g., "PROMIS_API", "EQ5D_UK_VALUES", "EQ5D_US_VALUES"
    /// </summary>
    public string? ExternalSource { get; set; }

    /// <summary>
    /// For Lookup scoring: name of the lookup table in the database
    /// </summary>
    public string? LookupTableName { get; set; }

    // Navigation properties
    public virtual PromTemplate? Template { get; set; }
    public virtual ICollection<SummaryScoreQuestionMapping> QuestionMappings { get; set; } = new List<SummaryScoreQuestionMapping>();
    public virtual ICollection<PromSummaryScore> CalculatedScores { get; set; } = new List<PromSummaryScore>();
}

/// <summary>
/// Maps questions to summary score definitions with optional weights.
/// </summary>
public class SummaryScoreQuestionMapping : BaseEntity
{
    /// <summary>
    /// Reference to the summary score definition
    /// </summary>
    public Guid SummaryScoreDefinitionId { get; set; }

    /// <summary>
    /// Reference to the template question
    /// </summary>
    public Guid TemplateQuestionId { get; set; }

    /// <summary>
    /// Weight for this question in the score calculation
    /// </summary>
    public decimal Weight { get; set; } = 1.0m;

    /// <summary>
    /// Whether this question should be reverse-scored
    /// </summary>
    public bool IsReverseScored { get; set; } = false;

    // Navigation properties
    public virtual SummaryScoreDefinition? SummaryScoreDefinition { get; set; }
    public virtual TemplateQuestion? TemplateQuestion { get; set; }
}

/// <summary>
/// Interpretation band for score ranges
/// </summary>
public class InterpretationBand
{
    public decimal Min { get; set; }
    public decimal Max { get; set; }
    public string Label { get; set; } = string.Empty;
    public string? Severity { get; set; }
    public string? Color { get; set; }
}

/// <summary>
/// Scoring method types for summary scores
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ScoringMethodType
{
    /// <summary>Simple sum of item scores</summary>
    Sum,
    /// <summary>Average of item scores</summary>
    Average,
    /// <summary>Sum converted to percentage of maximum</summary>
    Percentage,
    /// <summary>T-score normalization (mean=50, SD=10)</summary>
    TScore,
    /// <summary>Z-score normalization</summary>
    ZScore,
    /// <summary>Weighted sum with custom weights</summary>
    Weighted,
    /// <summary>Rasch/IRT-based scoring</summary>
    Rasch,
    /// <summary>Custom formula (defined in additional config)</summary>
    Custom,
    /// <summary>Score calculated via external API (e.g., PROMIS)</summary>
    External,
    /// <summary>Score from lookup table (e.g., EQ-5D value sets)</summary>
    Lookup
}
