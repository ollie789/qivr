using System.Text.Json.Serialization;
using Qivr.Core.Common;

namespace Qivr.Core.Entities;

/// <summary>
/// Normalized representation of a question within a PROM template.
/// Auto-synced from the Questions JSON for analytics and scoring.
/// </summary>
public class TemplateQuestion : TenantEntity
{
    /// <summary>
    /// Reference to the parent template
    /// </summary>
    public Guid TemplateId { get; set; }

    /// <summary>
    /// Stable question identifier from the JSON (usually a GUID string).
    /// This key remains constant even if question text changes.
    /// </summary>
    public string QuestionKey { get; set; } = string.Empty;

    /// <summary>
    /// Canonical code for cross-version analytics (e.g., "ODI_PAIN_INTENSITY", "KOOS_PAIN_Q1")
    /// </summary>
    public string? Code { get; set; }

    /// <summary>
    /// Short label for admin/analytics views
    /// </summary>
    public string Label { get; set; } = string.Empty;

    /// <summary>
    /// Full question text
    /// </summary>
    public string? QuestionText { get; set; }

    /// <summary>
    /// Type of question for rendering and scoring
    /// </summary>
    public QuestionType QuestionType { get; set; } = QuestionType.SingleSelect;

    /// <summary>
    /// Domain or subscale this question belongs to (e.g., "pain", "function", "qol")
    /// </summary>
    public string? Section { get; set; }

    /// <summary>
    /// Display order within the template
    /// </summary>
    public int OrderIndex { get; set; }

    /// <summary>
    /// Full question configuration JSON for frontend rendering
    /// </summary>
    public Dictionary<string, object>? ConfigJson { get; set; }

    /// <summary>
    /// Whether this question contributes to scoring
    /// </summary>
    public bool IsScored { get; set; } = true;

    /// <summary>
    /// Default weight for scoring (can be overridden per summary score)
    /// </summary>
    public decimal ScoreWeight { get; set; } = 1.0m;

    /// <summary>
    /// Whether this question is required
    /// </summary>
    public bool IsRequired { get; set; } = true;

    /// <summary>
    /// Minimum possible score value for this question
    /// </summary>
    public decimal? MinScore { get; set; }

    /// <summary>
    /// Maximum possible score value for this question
    /// </summary>
    public decimal? MaxScore { get; set; }

    // Navigation properties
    public virtual PromTemplate? Template { get; set; }
    public virtual ICollection<SummaryScoreQuestionMapping> ScoreMappings { get; set; } = new List<SummaryScoreQuestionMapping>();
    public virtual ICollection<PromItemResponse> ItemResponses { get; set; } = new List<PromItemResponse>();
}

/// <summary>
/// Question types for PROM templates
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum QuestionType
{
    SingleSelect,
    MultiSelect,
    Numeric,
    Scale,
    Slider,
    Text,
    Boolean,
    Date,
    Time,
    Rating
}
