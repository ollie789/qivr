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
    
    // Navigation properties
    public virtual ICollection<PromInstance> Instances { get; set; } = new List<PromInstance>();
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

    // Navigation properties
    public virtual PromTemplate? Template { get; set; }
    public virtual User? Patient { get; set; }
    public virtual TreatmentPlan? TreatmentPlan { get; set; }
    public virtual ICollection<PromResponse> Responses { get; set; } = new List<PromResponse>();
    public virtual ICollection<PromBookingRequest> BookingRequests { get; set; } = new List<PromBookingRequest>();
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
