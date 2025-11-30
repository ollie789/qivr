using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Qivr.Core.Common;

namespace Qivr.Core.Entities;

#region Enums

public enum TreatmentPlanStatus
{
    Draft,
    Active,
    Completed,
    Cancelled,
    OnHold
}

public enum PhaseStatus
{
    NotStarted,
    InProgress,
    Completed,
    Paused
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum MilestoneType
{
    SessionCount,
    PainReduction,
    PromImprovement,
    PhaseComplete,
    ExerciseStreak,
    WeekComplete
}

public enum DifficultyLevel
{
    Beginner,
    Intermediate,
    Advanced
}

#endregion

#region Main Entity

public class TreatmentPlan : DeletableEntity
{
    [Required]
    public Guid PatientId { get; set; }
    public virtual User? Patient { get; set; }

    [Required]
    public Guid ProviderId { get; set; }
    public virtual User? Provider { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    public string? Diagnosis { get; set; }
    public string? Goals { get; set; }

    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int DurationWeeks { get; set; }

    public TreatmentPlanStatus Status { get; set; } = TreatmentPlanStatus.Draft;

    // Legacy fields (kept for backward compatibility)
    public List<TreatmentSession> Sessions { get; set; } = new();
    public List<Exercise> Exercises { get; set; } = new();

    public string? Notes { get; set; }
    public DateTime? ReviewDate { get; set; }

    // === NEW: AI Generation Metadata ===
    public string? AiGeneratedSummary { get; set; }
    public double? AiConfidence { get; set; }
    public DateTime? AiGeneratedAt { get; set; }
    public Guid? SourceEvaluationId { get; set; }
    public string? AiRationale { get; set; }

    // === NEW: Phase-Based Structure ===
    public List<TreatmentPhase> Phases { get; set; } = new();

    // === NEW: PROM Configuration ===
    public TreatmentPlanPromConfig? PromConfig { get; set; }

    // === NEW: Progress Tracking ===
    public int TotalSessions { get; set; }
    public int CompletedSessions { get; set; }
    public decimal ProgressPercentage { get; set; }
    public int CurrentWeek { get; set; }
    public int ExerciseStreak { get; set; }
    public int PointsEarned { get; set; }

    // === NEW: Milestones for Engagement ===
    public List<TreatmentMilestone> Milestones { get; set; } = new();

    // === NEW: Daily Check-ins ===
    public List<DailyCheckIn> CheckIns { get; set; } = new();

    // === NEW: Approval Workflow ===
    public DateTime? ApprovedAt { get; set; }
    public Guid? ApprovedBy { get; set; }
}

#endregion

#region Phase-Based Treatment

public class TreatmentPhase
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public int PhaseNumber { get; set; }

    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public int DurationWeeks { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    public PhaseStatus Status { get; set; } = PhaseStatus.NotStarted;

    public List<string> Goals { get; set; } = new();
    public List<Exercise> Exercises { get; set; } = new();
    public int SessionsPerWeek { get; set; }

    // PROM template to use for this phase (e.g., "PHQ-9", "DASH", "NDI")
    public string? PromTemplateKey { get; set; }

    // Progress within this phase
    public int CompletedSessions { get; set; }
    public decimal PhaseProgressPercentage { get; set; }
}

#endregion

#region Sessions

public class TreatmentSession
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public int SessionNumber { get; set; }
    public int? PhaseNumber { get; set; }

    public DateTime ScheduledDate { get; set; }
    public DateTime? CompletedDate { get; set; }

    public string? Focus { get; set; }
    public string? Notes { get; set; }
    public bool Completed { get; set; }

    // Link to appointment
    public Guid? AppointmentId { get; set; }

    // Session-specific exercises (optional override of phase exercises)
    public List<string>? ExerciseIds { get; set; }

    // Patient feedback after session
    public int? PainLevelAfter { get; set; }
    public string? PatientNotes { get; set; }
}

#endregion

#region Exercises

public class Exercise
{
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Instructions { get; set; }

    public int Sets { get; set; }
    public int Reps { get; set; }
    public int? HoldSeconds { get; set; }
    public string? Frequency { get; set; }  // "Daily", "3x per week", etc.

    // Video support (for future)
    public string? VideoUrl { get; set; }
    public string? ThumbnailUrl { get; set; }

    // Categorization
    public string? Category { get; set; }  // "Stretching", "Strengthening", "Balance", "Mobility"
    public string? BodyRegion { get; set; }  // "Lower Back", "Shoulder", "Knee", etc.
    public DifficultyLevel Difficulty { get; set; } = DifficultyLevel.Beginner;

    // Patient tracking
    public bool Completed { get; set; }
    public List<ExerciseCompletion> Completions { get; set; } = new();
}

public class ExerciseCompletion
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public DateTime CompletedAt { get; set; }
    public int? PainLevelBefore { get; set; }
    public int? PainLevelAfter { get; set; }
    public string? Notes { get; set; }
    public int? SetsCompleted { get; set; }
    public int? RepsCompleted { get; set; }
}

#endregion

#region Milestones

public class TreatmentMilestone
{
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [MaxLength(100)]
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }

    public MilestoneType Type { get; set; }
    public int TargetValue { get; set; }
    public int CurrentValue { get; set; }

    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }

    public int PointsAwarded { get; set; }

    // Optional: icon for display
    public string? Icon { get; set; }
}

#endregion

#region Daily Check-Ins

public class DailyCheckIn
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public DateTime Date { get; set; }
    public int PainLevel { get; set; }
    public int Mood { get; set; }  // 1-5 scale
    public string? Notes { get; set; }
    public int ExercisesCompleted { get; set; }
    public int ExercisesAssigned { get; set; }

    // Computed from exercises completed that day
    public int PointsEarned { get; set; }

    // Track if this continued or broke a streak
    public bool ContinuedStreak { get; set; }
}

#endregion

#region PROM Configuration

public class TreatmentPlanPromConfig
{
    public bool AutoSchedule { get; set; } = true;
    public int DefaultIntervalWeeks { get; set; } = 2;

    // Map of PhaseNumber -> PROM template key
    public Dictionary<int, string> PhasePromTemplates { get; set; } = new();

    // Schedule at specific points
    public bool ScheduleAtPhaseStart { get; set; } = true;
    public bool ScheduleAtPhaseEnd { get; set; } = true;

    // Conditional triggers
    public List<PromTriggerCondition>? ConditionalTriggers { get; set; }
}

public class PromTriggerCondition
{
    public string PromTemplateKey { get; set; } = string.Empty;

    // Trigger type: "pain_increase", "prom_decline", "missed_sessions"
    public string TriggerType { get; set; } = string.Empty;

    // Threshold for trigger (e.g., pain > 7, prom decline > 10%)
    public int? ThresholdValue { get; set; }

    // Days after trigger to schedule PROM
    public int DaysAfterTrigger { get; set; } = 0;
}

#endregion
