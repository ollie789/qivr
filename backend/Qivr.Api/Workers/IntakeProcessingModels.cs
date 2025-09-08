using System;
using System.Collections.Generic;
using Qivr.Services.AI;

namespace Qivr.Api.Workers;

// Data models for intake processing
public class EvaluationData
{
    public Guid Id { get; set; }
    public string QuestionnaireResponses { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

// Triage request model
public class TriageRequest
{
    public Guid Id { get; set; }
    public string Symptoms { get; set; } = string.Empty;
    public string? MedicalHistory { get; set; }
    public VitalSigns? VitalSigns { get; set; }
    public string? Duration { get; set; }
    public string? Severity { get; set; }
    public List<string>? CurrentMedications { get; set; }
    public List<string>? Allergies { get; set; }
    public int? Age { get; set; }
}

// Triage data model
public class TriageData
{
    public Guid PatientId { get; set; }
    public string Symptoms { get; set; } = string.Empty;
    public string? MedicalHistory { get; set; }
    public VitalSigns? VitalSigns { get; set; }
    public string? Duration { get; set; }
    public string? Severity { get; set; }
    public List<string>? Medications { get; set; }
    public List<string>? Allergies { get; set; }
    public int? Age { get; set; }
    public DateTime Timestamp { get; set; }
}

// Vital signs model
public class VitalSigns
{
    public int? SystolicBP { get; set; }
    public int? DiastolicBP { get; set; }
    public int? HeartRate { get; set; }
    public decimal? Temperature { get; set; }
    public int? RespiratoryRate { get; set; }
    public int? OxygenSaturation { get; set; }
    public decimal? Weight { get; set; }
    public decimal? Height { get; set; }
}

// Triage summary model
public class TriageSummary
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public Guid RequestId { get; set; }
    public string ChiefComplaint { get; set; } = string.Empty;
    public string SummaryText { get; set; } = string.Empty;
    public Dictionary<string, object> SymptomAnalysis { get; set; } = new();
    public List<RiskFlag> RiskFlags { get; set; } = new();
    public UrgencyLevel UrgencyLevel { get; set; }
    public int UrgencyScore { get; set; }
    public string UrgencyRationale { get; set; } = string.Empty;
    public string RecommendedTimeframe { get; set; } = string.Empty;
    public List<PossibleCondition> PossibleConditions { get; set; } = new();
    public bool RequiresClinicianReview { get; set; }
    public DateTime GeneratedAt { get; set; }
    public Guid? DeIdentificationMappingId { get; set; }
    public double Confidence { get; set; }
}

// Risk flag model
public class RiskFlag
{
    public RiskType Type { get; set; }
    public string Description { get; set; } = string.Empty;
    public RiskSeverity Severity { get; set; }
    public bool RequiresImmediateAction { get; set; }
    public string? ClinicalRationale { get; set; }
}

// Possible condition model
public class PossibleCondition
{
    public string Condition { get; set; } = string.Empty;
    public string Likelihood { get; set; } = string.Empty;
    public string? Rationale { get; set; }
}

// Urgency assessment model
public class UrgencyAssessment
{
    public UrgencyLevel Level { get; set; }
    public int Score { get; set; }
    public string RecommendedTimeframe { get; set; } = string.Empty;
    public string Rationale { get; set; } = string.Empty;
    public DateTime AssessedAt { get; set; }
}

// Next step guidance model
public class NextStepGuidance
{
    public Guid Id { get; set; }
    public Guid TriageSummaryId { get; set; }
    public List<string> ImmediateActions { get; set; } = new();
    public string RecommendedCareLevel { get; set; } = string.Empty;
    public List<string> DiagnosticTests { get; set; } = new();
    public List<string> SelfCareInstructions { get; set; } = new();
    public List<string> WarningSignsToWatch { get; set; } = new();
    public string? FollowUpTimeframe { get; set; }
    public List<string> EducationTopics { get; set; } = new();
    public DateTime GeneratedAt { get; set; }
}

// Clinician review model
public class ClinicianReview
{
    public Guid Id { get; set; }
    public Guid TriageSummaryId { get; set; }
    public Guid PatientId { get; set; }
    public ReviewStatus Status { get; set; }
    public ReviewPriority Priority { get; set; }
    public DateTime SubmittedAt { get; set; }
    public DateTime RequiredByTime { get; set; }
    public List<RiskFlag> RiskFlags { get; set; } = new();
    public UrgencyLevel UrgencyLevel { get; set; }
    public string ChiefComplaint { get; set; } = string.Empty;
}

// Enums
public enum UrgencyLevel
{
    Low,
    Medium,
    High,
    Urgent
}

public enum RiskType
{
    CriticalSymptom,
    RedFlagCondition,
    VitalSign,
    DrugInteraction,
    AgeRelated,
    Other
}

public enum RiskSeverity
{
    Low,
    Moderate,
    High,
    Critical
}

public enum ReviewStatus
{
    Pending,
    InReview,
    Completed,
    Escalated
}

public enum ReviewPriority
{
    Normal,
    High,
    Urgent,
    Stat
}

// Service interfaces
public interface IEmailService
{
    Task SendIntakeConfirmationAsync(string toEmail, string patientName, string intakeId);
}

public interface INotificationService
{
    Task NotifyNewIntakeAsync(Guid tenantId, Guid intakeId, string patientName, string message);
}

// Bedrock service models
public interface IBedrockService
{
    Task<string> InvokeClaudeAsync(string prompt);
    Task<BedrockResponse> InvokeClaudeWithStructuredOutputAsync(string prompt, string systemPrompt, BedrockModelOptions options);
}

public class BedrockResponse
{
    public Dictionary<string, object> ParsedContent { get; set; } = new();
    public string RawContent { get; set; } = string.Empty;
}

public class BedrockModelOptions
{
    public float Temperature { get; set; } = 0.3f;
    public int MaxTokens { get; set; } = 1000;
}

// De-identification service
public interface IDeIdentificationService
{
    Task<DeIdentificationResult> DeIdentifyAsync(string text, DeIdentificationOptions? options = null);
}

public class DeIdentificationResult
{
    public string? DeIdentifiedText { get; set; }
    public Guid? MappingId { get; set; }
}

public class DeIdentificationOptions
{
    public bool EnableReIdentification { get; set; }
}
