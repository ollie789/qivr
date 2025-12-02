using System;
using System.Collections.Generic;
using Qivr.Core.Common;

namespace Qivr.Core.Entities;

// Triage Request Models
public class TriageRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Symptoms { get; set; } = string.Empty;
    public string? MedicalHistory { get; set; }
    public string? Duration { get; set; }
    public string? Severity { get; set; }
    public VitalSigns? VitalSigns { get; set; }
    public List<string>? CurrentMedications { get; set; }
    public List<string>? Allergies { get; set; }
    public int? Age { get; set; }
    public string? Gender { get; set; }
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
}

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
    public PainMapData? PainMapData { get; set; }
}

public class PainMapData
{
    public List<PainRegion> Regions { get; set; } = new();
}

public class PainRegion
{
    public string MeshName { get; set; } = string.Empty;
    public string? AnatomicalName { get; set; }
    public string Quality { get; set; } = string.Empty;
    public int Intensity { get; set; }
}

// Vital Signs
public class VitalSigns
{
    public double? Temperature { get; set; }
    public int? HeartRate { get; set; }
    public int? RespiratoryRate { get; set; }
    public int? SystolicBP { get; set; }
    public int? DiastolicBP { get; set; }
    public double? OxygenSaturation { get; set; }
    public double? PainLevel { get; set; }
    public DateTime? RecordedAt { get; set; }
}

// Triage Summary
public class TriageSummary
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public Guid RequestId { get; set; }
    public string ChiefComplaint { get; set; } = string.Empty;
    public string SummaryText { get; set; } = string.Empty;
    public Dictionary<string, object> SymptomAnalysis { get; set; } = new();
    public List<RiskFlag> RiskFlags { get; set; } = new();
    public string UrgencyLevel { get; set; } = string.Empty;
    public int UrgencyScore { get; set; }
    public string UrgencyRationale { get; set; } = string.Empty;
    public string RecommendedTimeframe { get; set; } = string.Empty;
    public List<PossibleCondition> PossibleConditions { get; set; } = new();
    public bool RequiresClinicianReview { get; set; }
    public DateTime GeneratedAt { get; set; }
    public Guid? DeIdentificationMappingId { get; set; }
    public double Confidence { get; set; }

    /// <summary>
    /// Status of AI processing: "completed", "fallback", or "failed"
    /// </summary>
    public string? AiProcessingStatus { get; set; }

    /// <summary>
    /// Reason for AI processing failure, if applicable
    /// </summary>
    public string? AiFailureReason { get; set; }

    // Navigation properties
    public virtual User? Patient { get; set; }
    public virtual ClinicianReview? ClinicianReview { get; set; }
    public virtual NextStepGuidance? NextStepGuidance { get; set; }
}

// Risk Flags
public class RiskFlag
{
    public RiskType Type { get; set; }
    public string Description { get; set; } = string.Empty;
    public RiskSeverity Severity { get; set; }
    public bool RequiresImmediateAction { get; set; }
    public string? ClinicalRationale { get; set; }
}

public enum RiskType
{
    CriticalSymptom,
    RedFlagCondition,
    VitalSign,
    DrugInteraction,
    AgeRelated,
    Comorbidity,
    Other
}

public enum RiskSeverity
{
    Critical,
    High,
    Moderate,
    Low
}

// Urgency Assessment
public class UrgencyAssessment
{
    public string Level { get; set; } = string.Empty;
    public int Score { get; set; }
    public string RecommendedTimeframe { get; set; } = string.Empty;
    public string Rationale { get; set; } = string.Empty;
    public DateTime AssessedAt { get; set; }
}

// UrgencyLevel enum is already defined in Evaluation.cs
// Using the existing definition from that file

// Possible Conditions
public class PossibleCondition
{
    public string Condition { get; set; } = string.Empty;
    public string Likelihood { get; set; } = string.Empty; // high, medium, low
    public string? Rationale { get; set; }
    public List<string>? SupportingSymptoms { get; set; }
    public List<string>? RuledOutBy { get; set; }
}

// Next Step Guidance
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
    
    // Navigation property
    public virtual TriageSummary? TriageSummary { get; set; }
}

// Clinician Review
public class ClinicianReview
{
    public Guid Id { get; set; }
    public Guid TriageSummaryId { get; set; }
    public Guid PatientId { get; set; }
    public Guid? ReviewingClinicianId { get; set; }
    public ReviewStatus Status { get; set; }
    public ReviewPriority Priority { get; set; }
    public DateTime SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public DateTime RequiredByTime { get; set; }
    public string? ClinicianNotes { get; set; }
    public string? ClinicianRecommendations { get; set; }
    public bool? AgreesWithAiAssessment { get; set; }
    public string? ClinicianUrgencyOverride { get; set; }
    public List<string>? AdditionalOrders { get; set; }
    public List<RiskFlag> RiskFlags { get; set; } = new();
    public string UrgencyLevel { get; set; } = string.Empty;
    public string ChiefComplaint { get; set; } = string.Empty;
    
    // Navigation properties
    public virtual TriageSummary? TriageSummary { get; set; }
    public virtual User? Patient { get; set; }
    public virtual User? ReviewingClinician { get; set; }
}

public enum ReviewStatus
{
    Pending,
    InReview,
    Reviewed,
    Escalated,
    Cancelled
}

public enum ReviewPriority
{
    Stat,     // Immediate review required
    Urgent,   // Review within 15 minutes
    High,     // Review within 1 hour
    Normal,   // Review within 4 hours
    Low       // Review within 24 hours
}

// Audit and Tracking
public class TriageAuditLog
{
    public Guid Id { get; set; }
    public Guid TriageSummaryId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? Details { get; set; }
    public Guid? PerformedBy { get; set; }
    public DateTime Timestamp { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
}

// Configuration
public class TriageConfiguration
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public bool EnableAiTriage { get; set; } = true;
    public bool RequireClinicianReviewForHighRisk { get; set; } = true;
    public int MaxWaitTimeEmergencyMinutes { get; set; } = 0;
    public int MaxWaitTimeUrgentMinutes { get; set; } = 60;
    public int MaxWaitTimeSemiUrgentMinutes { get; set; } = 240;
    public int MaxWaitTimeNonUrgentMinutes { get; set; } = 1440;
    public bool EnableDeIdentification { get; set; } = true;
    public bool RetainDeIdentificationMappings { get; set; } = false;
    public List<string> CustomRiskKeywords { get; set; } = new();
    public Dictionary<string, int> CustomUrgencyScoring { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
