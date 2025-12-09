using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Qivr.Core.Entities;

namespace Qivr.Core.DTOs;

#region Instrument DTOs

/// <summary>
/// DTO for creating a new instrument in the catalogue
/// </summary>
public class CreateInstrumentDto
{
    [Required]
    [MaxLength(50)]
    public string Key { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? InstrumentFamily { get; set; }

    [MaxLength(100)]
    public string? ClinicalDomain { get; set; }

    public InstrumentLicenseType LicenseType { get; set; } = InstrumentLicenseType.Open;

    public string? LicenseNotes { get; set; }

    public bool IsGlobal { get; set; } = true;

    public string? Description { get; set; }

    [MaxLength(500)]
    public string? ReferenceUrl { get; set; }
}

/// <summary>
/// DTO for updating an existing instrument
/// </summary>
public class UpdateInstrumentDto
{
    [MaxLength(200)]
    public string? Name { get; set; }

    [MaxLength(100)]
    public string? InstrumentFamily { get; set; }

    [MaxLength(100)]
    public string? ClinicalDomain { get; set; }

    public InstrumentLicenseType? LicenseType { get; set; }

    public string? LicenseNotes { get; set; }

    public string? Description { get; set; }

    [MaxLength(500)]
    public string? ReferenceUrl { get; set; }

    public bool? IsActive { get; set; }
}

/// <summary>
/// Response DTO for instrument data
/// </summary>
public class InstrumentDto
{
    public Guid Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? InstrumentFamily { get; set; }
    public string? ClinicalDomain { get; set; }
    public string LicenseType { get; set; } = "Open";
    public string? LicenseNotes { get; set; }
    public bool IsGlobal { get; set; }
    public Guid? TenantId { get; set; }
    public bool IsActive { get; set; }
    public string? Description { get; set; }
    public string? ReferenceUrl { get; set; }
    public int TemplateCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Lightweight instrument summary for dropdowns
/// </summary>
public class InstrumentSummaryDto
{
    public Guid Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? ClinicalDomain { get; set; }
    public string LicenseType { get; set; } = "Open";
}

#endregion

#region Template Question DTOs

/// <summary>
/// Response DTO for template question data
/// </summary>
public class TemplateQuestionDto
{
    public Guid Id { get; set; }
    public Guid TemplateId { get; set; }
    public string QuestionKey { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string Label { get; set; } = string.Empty;
    public string? QuestionText { get; set; }
    public string QuestionType { get; set; } = "SingleSelect";
    public string? Section { get; set; }
    public int OrderIndex { get; set; }
    public bool IsScored { get; set; }
    public decimal ScoreWeight { get; set; }
    public bool IsRequired { get; set; }
    public decimal? MinScore { get; set; }
    public decimal? MaxScore { get; set; }
    public Dictionary<string, object>? ConfigJson { get; set; }
}

/// <summary>
/// DTO for syncing questions from JSON to normalized table
/// </summary>
public class SyncQuestionDto
{
    [Required]
    public string QuestionKey { get; set; } = string.Empty;

    public string? Code { get; set; }

    [Required]
    public string Label { get; set; } = string.Empty;

    public string? QuestionText { get; set; }

    public QuestionType QuestionType { get; set; } = QuestionType.SingleSelect;

    public string? Section { get; set; }

    public int OrderIndex { get; set; }

    public bool IsScored { get; set; } = true;

    public decimal ScoreWeight { get; set; } = 1.0m;

    public bool IsRequired { get; set; } = true;

    public decimal? MinScore { get; set; }

    public decimal? MaxScore { get; set; }

    public Dictionary<string, object>? ConfigJson { get; set; }
}

#endregion

#region Summary Score Definition DTOs

/// <summary>
/// DTO for creating/updating a summary score definition
/// </summary>
public class SummaryScoreDefinitionDto
{
    public Guid? Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string ScoreKey { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Label { get; set; } = string.Empty;

    public string? Description { get; set; }

    public ScoringMethodType ScoringMethod { get; set; } = ScoringMethodType.Sum;

    public decimal RangeMin { get; set; } = 0;

    public decimal RangeMax { get; set; } = 100;

    public bool HigherIsBetter { get; set; } = false;

    public decimal? PopulationMean { get; set; }

    public decimal? PopulationStdDev { get; set; }

    public List<InterpretationBandDto>? InterpretationBands { get; set; }

    public decimal? MCID { get; set; }

    public int OrderIndex { get; set; }

    public bool IsPrimary { get; set; }

    public List<Guid>? QuestionIds { get; set; }
}

/// <summary>
/// DTO for interpretation band configuration
/// </summary>
public class InterpretationBandDto
{
    public decimal Min { get; set; }
    public decimal Max { get; set; }
    public string Label { get; set; } = string.Empty;
    public string? Severity { get; set; }
    public string? Color { get; set; }
}

#endregion

#region Item Response DTOs

/// <summary>
/// Response DTO for a single item response
/// </summary>
public class PromItemResponseDto
{
    public Guid Id { get; set; }
    public Guid InstanceId { get; set; }
    public Guid TemplateQuestionId { get; set; }
    public string? QuestionCode { get; set; }
    public string? QuestionLabel { get; set; }
    public string? ValueRaw { get; set; }
    public decimal? ValueNumeric { get; set; }
    public string? ValueDisplay { get; set; }
    public List<string>? MultiSelectValues { get; set; }
    public bool IsSkipped { get; set; }
    public int? ResponseTimeSeconds { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO for submitting an item response
/// </summary>
public class SubmitItemResponseDto
{
    [Required]
    public string QuestionKey { get; set; } = string.Empty;

    public string? ValueRaw { get; set; }

    public decimal? ValueNumeric { get; set; }

    public string? ValueDisplay { get; set; }

    public List<string>? MultiSelectValues { get; set; }

    public bool IsSkipped { get; set; }

    public int? ResponseTimeSeconds { get; set; }
}

#endregion

#region Summary Score DTOs

/// <summary>
/// Response DTO for a calculated summary score
/// </summary>
public class PromSummaryScoreDto
{
    public Guid Id { get; set; }
    public Guid InstanceId { get; set; }
    public Guid? DefinitionId { get; set; }
    public string ScoreKey { get; set; } = string.Empty;
    public string? Label { get; set; }
    public decimal Value { get; set; }
    public decimal? RawValue { get; set; }
    public decimal? RangeMin { get; set; }
    public decimal? RangeMax { get; set; }
    public bool? HigherIsBetter { get; set; }
    public string? InterpretationBand { get; set; }
    public string? Severity { get; set; }
    public int? ItemCount { get; set; }
    public int? MissingItemCount { get; set; }
    public decimal? ConfidenceIntervalLower { get; set; }
    public decimal? ConfidenceIntervalUpper { get; set; }
    public bool HasFloorEffect { get; set; }
    public bool HasCeilingEffect { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Summary of scores for a PROM instance
/// </summary>
public class PromInstanceScoreSummaryDto
{
    public Guid InstanceId { get; set; }
    public Guid TemplateId { get; set; }
    public string TemplateKey { get; set; } = string.Empty;
    public string TemplateName { get; set; } = string.Empty;
    public DateTime? CompletedAt { get; set; }
    public PromSummaryScoreDto? PrimaryScore { get; set; }
    public List<PromSummaryScoreDto> AllScores { get; set; } = new();
}

#endregion

#region Analytics DTOs

/// <summary>
/// Request for analytics queries
/// </summary>
public class PromAnalyticsQueryDto
{
    public Guid? TemplateId { get; set; }
    public string? InstrumentKey { get; set; }
    public string? ScoreKey { get; set; }
    public string? QuestionCode { get; set; }
    public Guid? PatientId { get; set; }
    public Guid? ProviderId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? GroupBy { get; set; } // "day", "week", "month", "quarter", "year"
}

/// <summary>
/// Aggregated score statistics
/// </summary>
public class ScoreAggregationDto
{
    public string GroupKey { get; set; } = string.Empty;
    public string? GroupLabel { get; set; }
    public int Count { get; set; }
    public decimal? Average { get; set; }
    public decimal? Median { get; set; }
    public decimal? Min { get; set; }
    public decimal? Max { get; set; }
    public decimal? StandardDeviation { get; set; }
    public Dictionary<string, int>? BandDistribution { get; set; }
}

/// <summary>
/// Item-level response distribution
/// </summary>
public class ItemResponseDistributionDto
{
    public string QuestionCode { get; set; } = string.Empty;
    public string? QuestionLabel { get; set; }
    public int TotalResponses { get; set; }
    public List<ResponseOptionCountDto> Distribution { get; set; } = new();
}

/// <summary>
/// Count of responses for a specific option
/// </summary>
public class ResponseOptionCountDto
{
    public string Value { get; set; } = string.Empty;
    public string? DisplayLabel { get; set; }
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}

/// <summary>
/// Patient score trend over time
/// </summary>
public class PatientScoreTrendDto
{
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string InstrumentKey { get; set; } = string.Empty;
    public string ScoreKey { get; set; } = string.Empty;
    public List<ScoreTrendPointDto> DataPoints { get; set; } = new();
    public decimal? OverallChange { get; set; }
    public bool? AchievedMCID { get; set; }
}

/// <summary>
/// Single data point in a score trend
/// </summary>
public class ScoreTrendPointDto
{
    public DateTime Date { get; set; }
    public decimal Value { get; set; }
    public string? InterpretationBand { get; set; }
    public string? Context { get; set; } // "baseline", "3m follow-up", etc.
    public Guid InstanceId { get; set; }
}

#endregion

#region Enhanced Template DTOs

/// <summary>
/// Enhanced template response with normalized question data
/// </summary>
public class EnhancedPromTemplateDto
{
    public Guid Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public int Version { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public bool IsActive { get; set; }

    // New instrument link
    public Guid? InstrumentId { get; set; }
    public InstrumentSummaryDto? Instrument { get; set; }

    public int SchemaVersion { get; set; }
    public List<string>? Tags { get; set; }
    public string? FrequencyHint { get; set; }

    // Original JSON for frontend
    public List<Dictionary<string, object>> Questions { get; set; } = new();

    // Normalized questions for analytics
    public List<TemplateQuestionDto> NormalizedQuestions { get; set; } = new();

    // Scoring definitions
    public List<SummaryScoreDefinitionDto> ScoreDefinitions { get; set; } = new();

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Request to create/update a template with auto-sync
/// </summary>
public class CreatePromTemplateWithSyncDto
{
    [Required]
    [MaxLength(50)]
    public string Key { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    [MaxLength(100)]
    public string Category { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Frequency { get; set; } = string.Empty;

    public Guid? InstrumentId { get; set; }

    public List<string>? Tags { get; set; }

    [MaxLength(200)]
    public string? FrequencyHint { get; set; }

    /// <summary>
    /// Full questions JSON for frontend rendering
    /// </summary>
    [Required]
    public List<Dictionary<string, object>> Questions { get; set; } = new();

    /// <summary>
    /// Scoring rules JSON
    /// </summary>
    public Dictionary<string, object>? ScoringRules { get; set; }

    /// <summary>
    /// Optional: Pre-defined score definitions (if not provided, will be inferred from ScoringRules)
    /// </summary>
    public List<SummaryScoreDefinitionDto>? ScoreDefinitions { get; set; }
}

#endregion
