using Qivr.Core.Common;

namespace Qivr.Core.Entities;

/// <summary>
/// Stores individual item-level responses for a PROM instance.
/// One row per (instance, question) - enables analytics queries.
/// </summary>
public class PromItemResponse : TenantEntity
{
    /// <summary>
    /// Reference to the PROM instance
    /// </summary>
    public Guid InstanceId { get; set; }

    /// <summary>
    /// Reference to the template question (for joining to question metadata)
    /// </summary>
    public Guid TemplateQuestionId { get; set; }

    /// <summary>
    /// Denormalized question code for cross-version analytics.
    /// Allows querying across template versions without joins.
    /// </summary>
    public string? QuestionCode { get; set; }

    /// <summary>
    /// Original response value as stored (string representation)
    /// </summary>
    public string? ValueRaw { get; set; }

    /// <summary>
    /// Numeric value for scoring (extracted from option scores or direct input)
    /// </summary>
    public decimal? ValueNumeric { get; set; }

    /// <summary>
    /// Human-readable display value (e.g., "Moderate difficulty")
    /// </summary>
    public string? ValueDisplay { get; set; }

    /// <summary>
    /// For multi-select questions, stores all selected values as JSON array
    /// </summary>
    public List<string>? MultiSelectValues { get; set; }

    /// <summary>
    /// Whether this response was skipped/not answered
    /// </summary>
    public bool IsSkipped { get; set; } = false;

    /// <summary>
    /// Time spent on this question in seconds (if tracked)
    /// </summary>
    public int? ResponseTimeSeconds { get; set; }

    // Navigation properties
    public virtual PromInstance? Instance { get; set; }
    public virtual TemplateQuestion? TemplateQuestion { get; set; }
}
