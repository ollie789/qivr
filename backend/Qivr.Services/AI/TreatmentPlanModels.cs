using Qivr.Core.Entities;

namespace Qivr.Services.AI;

#region Request Models

public class TreatmentPlanGenerationRequest
{
    public Guid PatientId { get; set; }
    public Guid? EvaluationId { get; set; }
    public Guid ProviderId { get; set; }
    public Guid TenantId { get; set; }

    // Data sources (optional - service will fetch if not provided)
    public EvaluationDataForAi? Evaluation { get; set; }
    public List<PainRegionForAi>? PainMaps { get; set; }
    public List<PromResponseSummary>? PromHistory { get; set; }
    public MedicalHistorySummary? MedicalHistory { get; set; }

    // Customization options
    public int? PreferredDurationWeeks { get; set; }
    public int? SessionsPerWeek { get; set; }
    public List<string>? FocusAreas { get; set; }
    public List<string>? Contraindications { get; set; }
}

public class EvaluationDataForAi
{
    public string? ChiefComplaint { get; set; }
    public List<string> Symptoms { get; set; } = new();
    public string? Duration { get; set; }
    public int? PainSeverity { get; set; }
    public string? AiSummary { get; set; }
}

public class PainRegionForAi
{
    public string BodyRegion { get; set; } = "";
    public string? AnatomicalName { get; set; }
    public int Intensity { get; set; }
    public string? PainType { get; set; }
    public List<string> PainQuality { get; set; } = new();
}

public class PromResponseSummary
{
    public string PromType { get; set; } = "";
    public decimal Score { get; set; }
    public string? Severity { get; set; }
    public DateTime CompletedAt { get; set; }
}

public class MedicalHistorySummary
{
    public List<string> Conditions { get; set; } = new();
    public List<string> Medications { get; set; } = new();
    public List<string> Allergies { get; set; } = new();
    public List<string> PreviousSurgeries { get; set; } = new();
    public int? Age { get; set; }
}

#endregion

#region Response Models

public class GeneratedTreatmentPlan
{
    public string Title { get; set; } = "";
    public string? Diagnosis { get; set; }
    public string? Summary { get; set; }
    public int TotalDurationWeeks { get; set; }
    public List<GeneratedPhase> Phases { get; set; } = new();
    public List<GeneratedMilestone> Milestones { get; set; } = new();
    public GeneratedPromSchedule? PromSchedule { get; set; }
    public double Confidence { get; set; }
    public string? Rationale { get; set; }
}

public class GeneratedPhase
{
    public int PhaseNumber { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public int DurationWeeks { get; set; }
    public List<string> Goals { get; set; } = new();
    public int SessionsPerWeek { get; set; }
    public List<GeneratedExercise> Exercises { get; set; } = new();
    public string? PromTemplateKey { get; set; }
}

public class GeneratedExercise
{
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public string? Instructions { get; set; }
    public int Sets { get; set; }
    public int Reps { get; set; }
    public int? HoldSeconds { get; set; }
    public string? Frequency { get; set; }
    public string? Category { get; set; }
    public string? BodyRegion { get; set; }
    public string? Difficulty { get; set; }
}

public class GeneratedMilestone
{
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public string Type { get; set; } = "";  // "SessionCount", "PainReduction", etc.
    public int TargetValue { get; set; }
    public int PointsAwarded { get; set; }
}

public class GeneratedPromSchedule
{
    public bool AutoSchedule { get; set; } = true;
    public int IntervalWeeks { get; set; } = 2;
}

#endregion

#region Exercise Suggestion Models

public class ExerciseSuggestionRequest
{
    public string? BodyRegion { get; set; }
    public string? Condition { get; set; }
    public string? Difficulty { get; set; }
    public List<string>? ExcludeExercises { get; set; }
    public int MaxResults { get; set; } = 5;
}

public class TreatmentPlanAdjustmentRequest
{
    public Guid TreatmentPlanId { get; set; }
    public string? Reason { get; set; }  // "pain_increase", "good_progress", "plateau"
    public int? CurrentPainLevel { get; set; }
    public decimal? CurrentPromScore { get; set; }
}

public class TreatmentPlanAdjustment
{
    public string Recommendation { get; set; } = "";
    public List<string> SuggestedChanges { get; set; } = new();
    public List<GeneratedExercise>? NewExercises { get; set; }
    public int? NewSessionsPerWeek { get; set; }
    public string? Rationale { get; set; }
}

#endregion
