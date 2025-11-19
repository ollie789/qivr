namespace Qivr.Services.AI;

public class TriageRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string? Symptoms { get; set; }
    public string? MedicalHistory { get; set; }
    public string? ChiefComplaint { get; set; }
    public string? Duration { get; set; }
    public int? Severity { get; set; }
    public List<string>? CurrentMedications { get; set; }
    public List<string>? Allergies { get; set; }
    public int? Age { get; set; }
    public VitalSigns? VitalSigns { get; set; }
}

public class TriageData
{
    public Guid PatientId { get; set; }
    public string Symptoms { get; set; } = "";
    public string? MedicalHistory { get; set; }
    public VitalSigns? VitalSigns { get; set; }
    public string? Duration { get; set; }
    public int? Severity { get; set; }
    public List<string>? Medications { get; set; }
    public List<string>? Allergies { get; set; }
    public int? Age { get; set; }
    public DateTime Timestamp { get; set; }
}

public class VitalSigns
{
    public int? HeartRate { get; set; }
    public int? SystolicBP { get; set; }
    public int? DiastolicBP { get; set; }
    public double? Temperature { get; set; }
    public int? RespiratoryRate { get; set; }
    public int? OxygenSaturation { get; set; }
}

public class TriageSummary
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public Guid RequestId { get; set; }
    public string ChiefComplaint { get; set; } = "";
    public string SummaryText { get; set; } = "";
    public string Summary => SummaryText;
    public Dictionary<string, object> SymptomAnalysis { get; set; } = new();
    public List<RiskFlag> RiskFlags { get; set; } = new();
    public string UrgencyLevel { get; set; } = "";
    public int UrgencyScore { get; set; }
    public string UrgencyRationale { get; set; } = "";
    public string RecommendedTimeframe { get; set; } = "";
    public List<PossibleCondition> PossibleConditions { get; set; } = new();
    public bool RequiresClinicianReview { get; set; }
    public DateTime GeneratedAt { get; set; }
    public Guid? DeIdentificationMappingId { get; set; }
    public double Confidence { get; set; }
    public UrgencyAssessment UrgencyAssessment => new()
    {
        Level = UrgencyLevel,
        Score = UrgencyScore,
        Rationale = UrgencyRationale,
        RecommendedTimeframe = RecommendedTimeframe,
        AssessedAt = GeneratedAt
    };
}

public class RiskFlag
{
    public RiskType Type { get; set; }
    public string Description { get; set; } = "";
    public RiskSeverity Severity { get; set; }
    public bool RequiresImmediateAction { get; set; }
    public string? ClinicalRationale { get; set; }
}

public class UrgencyAssessment
{
    public string Level { get; set; } = "";
    public int Score { get; set; }
    public string RecommendedTimeframe { get; set; } = "";
    public string Rationale { get; set; } = "";
    public DateTime AssessedAt { get; set; }
}

public class PossibleCondition
{
    public string Condition { get; set; } = "";
    public string Likelihood { get; set; } = "";
    public string? Rationale { get; set; }
}

public class NextStepGuidance
{
    public Guid Id { get; set; }
    public Guid TriageSummaryId { get; set; }
    public List<string> ImmediateActions { get; set; } = new();
    public string RecommendedCareLevel { get; set; } = "";
    public List<string> DiagnosticTests { get; set; } = new();
    public List<string> SelfCareInstructions { get; set; } = new();
    public List<string> WarningSignsToWatch { get; set; } = new();
    public string? FollowUpTimeframe { get; set; }
    public List<string> EducationTopics { get; set; } = new();
    public DateTime GeneratedAt { get; set; }
}

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
    public string UrgencyLevel { get; set; } = "";
    public string ChiefComplaint { get; set; } = "";
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

public enum UrgencyLevel
{
    Low,
    Medium,
    High,
    Urgent
}

public enum ReviewStatus
{
    Pending,
    InProgress,
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
