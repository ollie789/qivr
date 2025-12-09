using System.Text.Json.Serialization;
using Qivr.Core.Common;

namespace Qivr.Core.Entities;

public class PromTemplate : TenantEntity
{
    public string Key { get; set; } = string.Empty;
    public int Version { get; set; } = 1;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty; // daily, weekly, monthly, etc.
    public List<Dictionary<string, object>> Questions { get; set; } = new();
    public Dictionary<string, object>? ScoringMethod { get; set; }
    public Dictionary<string, object>? ScoringRules { get; set; }
    public bool IsActive { get; set; } = true;

    // === NEW: Instrument & Schema Fields ===
    /// <summary>
    /// Reference to the instrument catalogue (null for custom templates)
    /// </summary>
    public Guid? InstrumentId { get; set; }

    /// <summary>
    /// Version of the internal JSON schema for questions/scoring
    /// </summary>
    public int SchemaVersion { get; set; } = 1;

    /// <summary>
    /// Tags for categorization (e.g., ["arthroplasty", "post-op", "baseline"])
    /// </summary>
    public List<string>? Tags { get; set; }

    /// <summary>
    /// Suggested frequency/timing hint (e.g., "baseline, 6w, 3m, 12m")
    /// </summary>
    public string? FrequencyHint { get; set; }

    // Navigation properties
    public virtual Instrument? Instrument { get; set; }
    public virtual ICollection<PromInstance> Instances { get; set; } = new List<PromInstance>();
    public virtual ICollection<TemplateQuestion> TemplateQuestions { get; set; } = new List<TemplateQuestion>();
    public virtual ICollection<SummaryScoreDefinition> SummaryScoreDefinitions { get; set; } = new List<SummaryScoreDefinition>();
}

public class PromInstance : TenantEntity
{
    public Guid TemplateId { get; set; }
    public Guid PatientId { get; set; }
    public PromStatus Status { get; set; } = PromStatus.Pending;
    public DateTime ScheduledFor { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime DueDate { get; set; }
    public Dictionary<string, object>? ResponseData { get; set; }  // Raw response data
    public decimal? Score { get; set; }
    public DateTime? ReminderSentAt { get; set; }

    // === NEW: Treatment Plan & Device Outcome Tracking ===
    /// <summary>
    /// Links this PROM to a treatment plan for outcome tracking
    /// </summary>
    public Guid? TreatmentPlanId { get; set; }

    /// <summary>
    /// Type of PROM in treatment context (baseline, follow-up, etc.)
    /// </summary>
    public PromInstanceType InstanceType { get; set; } = PromInstanceType.Standard;

    /// <summary>
    /// For follow-up PROMs, weeks since treatment/procedure started
    /// </summary>
    public int? WeeksPostProcedure { get; set; }

    // === Perfect Study Perception Metrics ===
    /// <summary>
    /// Global Perceived Effect (GPE) 7-point scale: -3 to +3
    /// -3=Very much worse, -2=Much worse, -1=Slightly worse, 0=No change,
    /// +1=Slightly better, +2=Much better, +3=Very much better
    /// </summary>
    public int? GlobalPerceivedEffect { get; set; }

    /// <summary>
    /// Patient Acceptable Symptom State (PASS): true = acceptable, false = not acceptable
    /// "Taking into account all the activities you do, do you consider your current state satisfactory?"
    /// </summary>
    public bool? PatientAcceptableSymptomState { get; set; }

    /// <summary>
    /// Overall satisfaction with treatment outcome (1-10 scale)
    /// </summary>
    public int? SatisfactionScore { get; set; }

    /// <summary>
    /// Did the outcome meet expectations? (1=Much worse than expected, 5=As expected, 9=Much better than expected)
    /// </summary>
    public int? ExpectationMatch { get; set; }

    /// <summary>
    /// Perceived treatment success: true = successful, false = not successful
    /// "Do you consider your treatment to have been successful?"
    /// </summary>
    public bool? PerceivedSuccess { get; set; }

    /// <summary>
    /// Would recommend this treatment to others (1-10 scale, Net Promoter Score style)
    /// </summary>
    public int? WouldRecommend { get; set; }

    /// <summary>
    /// Free-text patient narrative about their experience (vectorized for analysis)
    /// </summary>
    public string? PatientNarrative { get; set; }

    // Navigation properties
    public virtual PromTemplate? Template { get; set; }
    public virtual User? Patient { get; set; }
    public virtual TreatmentPlan? TreatmentPlan { get; set; }
    public virtual ICollection<PromResponse> Responses { get; set; } = new List<PromResponse>();
    public virtual ICollection<PromBookingRequest> BookingRequests { get; set; } = new List<PromBookingRequest>();

    // === NEW: Analytics-ready responses and scores ===
    public virtual ICollection<PromItemResponse> ItemResponses { get; set; } = new List<PromItemResponse>();
    public virtual ICollection<PromSummaryScore> SummaryScores { get; set; } = new List<PromSummaryScore>();
}

public enum PromStatus
{
    Pending,
    InProgress,
    Completed,
    Expired,
    Cancelled
}

/// <summary>
/// Type of PROM instance for tracking device/treatment outcomes
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum PromInstanceType
{
    /// <summary>Standard PROM not linked to treatment outcome</summary>
    Standard,
    /// <summary>Baseline measurement at start of treatment or pre-surgery</summary>
    Baseline,
    /// <summary>Follow-up measurement during or after treatment</summary>
    FollowUp,
    /// <summary>Final outcome measurement at end of treatment</summary>
    FinalOutcome
}

public class PromBookingRequest : TenantEntity
{
    public Guid PromInstanceId { get; set; }
    public Guid PatientId { get; set; }
    public DateTime PreferredDate { get; set; }
    public DateTime? AlternativeDate { get; set; }
    public string TimePreference { get; set; } = string.Empty;
    public string ReasonForVisit { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

    public virtual PromInstance? PromInstance { get; set; }
}

/// <summary>
/// Treatment progress feedback captured during PROM completion.
/// These questions are automatically appended when a PROM is linked to an active treatment plan.
/// </summary>
public class TreatmentProgressFeedback : TenantEntity
{
    public Guid PromInstanceId { get; set; }
    public Guid TreatmentPlanId { get; set; }
    public Guid PatientId { get; set; }

    // === Overall Treatment Rating ===
    /// <summary>
    /// Overall effectiveness of treatment plan (1-10)
    /// </summary>
    public int? OverallEffectivenessRating { get; set; }

    /// <summary>
    /// Pain level compared to start of treatment (-3 to +3)
    /// -3=Much worse, 0=Same, +3=Much better
    /// </summary>
    public int? PainComparedToStart { get; set; }

    /// <summary>
    /// Are you completing your prescribed exercises?
    /// </summary>
    public ExerciseComplianceLevel? ExerciseCompliance { get; set; }

    /// <summary>
    /// How many sessions have you completed this week?
    /// </summary>
    public int? SessionsCompletedThisWeek { get; set; }

    // === Exercise-Specific Feedback ===
    /// <summary>
    /// Exercise IDs the patient found most helpful (JSON array)
    /// </summary>
    public List<Guid>? HelpfulExerciseIds { get; set; }

    /// <summary>
    /// Exercise IDs causing discomfort (JSON array)
    /// </summary>
    public List<Guid>? ProblematicExerciseIds { get; set; }

    /// <summary>
    /// Free-text comments about exercises
    /// </summary>
    public string? ExerciseComments { get; set; }

    // === Barriers & Suggestions ===
    /// <summary>
    /// Barriers to completing treatment (multi-select)
    /// </summary>
    public List<string>? Barriers { get; set; }

    /// <summary>
    /// Patient suggestions for improvement
    /// </summary>
    public string? Suggestions { get; set; }

    /// <summary>
    /// Would you like to discuss your treatment with your clinician?
    /// </summary>
    public bool? WantsClinicianDiscussion { get; set; }

    /// <summary>
    /// Current treatment phase when feedback was given
    /// </summary>
    public int? CurrentPhaseNumber { get; set; }

    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public virtual PromInstance? PromInstance { get; set; }
    public virtual TreatmentPlan? TreatmentPlan { get; set; }
    public virtual User? Patient { get; set; }
}

/// <summary>
/// Exercise compliance levels for treatment progress tracking
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ExerciseComplianceLevel
{
    Never,
    Rarely,      // Less than 25%
    Sometimes,   // 25-50%
    Often,       // 50-75%
    Always       // 75-100%
}
